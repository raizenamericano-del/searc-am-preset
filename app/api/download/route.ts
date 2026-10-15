import { getVideo } from "@/lib/services/video";
import { mediaStore } from "@/lib/services/media-store";
import { handleError, jsonError, rateLimit } from "@/lib/server/respond";
import { isAllowedMediaUrl } from "@/lib/utils/media-hosts";
import { downloadSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 150 * 1024 * 1024;
const CONNECT_TIMEOUT_MS = 15_000;

/**
 * Streams provider media to the browser as an attachment.
 * The client never supplies a URL — only a video ID + type. The media URL
 * comes from provider data and must be on the media host allowlist.
 * Nothing is written to disk.
 */
export async function GET(req: Request) {
  const limited = rateLimit(req, 3);
  if (limited) return limited;
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const parsed = downloadSchema.safeParse(params);
  if (!parsed.success) return jsonError(400, "BAD_REQUEST", "Parameter unduhan tidak valid.");
  const { id, type } = parsed.data;

  try {
    let media = mediaStore.get(id);
    if (!media) {
      await getVideo(id);
      media = mediaStore.get(id);
    }
    const src = type === "audio" ? media?.music : type === "hd" ? media?.hdplay : media?.play;
    if (!src || !isAllowedMediaUrl(src)) {
      return jsonError(404, "NOT_FOUND", type === "audio" ? "Provider tidak menyediakan audio untuk video ini." : "Provider tidak menyediakan file video untuk item ini.");
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CONNECT_TIMEOUT_MS);
    let upstream: Response;
    try {
      upstream = await fetch(src, {
        signal: controller.signal,
        redirect: "manual",
        headers: { "user-agent": "Mozilla/5.0 (compatible; AMPencariPreset/1.0)" },
        cache: "no-store",
      });
    } finally {
      clearTimeout(timer);
    }
    // Media CDN redirects are not followed (could point anywhere).
    if (upstream.status >= 300 && upstream.status < 400) {
      return jsonError(502, "PROVIDER_ERROR", "Sumber media dialihkan; unduhan dibatalkan demi keamanan.");
    }
    if (!upstream.ok || !upstream.body) {
      return jsonError(502, "PROVIDER_ERROR", "Sumber media tidak dapat diambil (mungkin tautan sudah kedaluwarsa). Muat ulang detail video lalu coba lagi.");
    }
    const len = Number(upstream.headers.get("content-length"));
    if (Number.isFinite(len) && len > MAX_BYTES) return jsonError(413, "PAYLOAD_TOO_LARGE", "File media terlalu besar.");

    const ctype = upstream.headers.get("content-type") ?? "";
    const isAudio = type === "audio";
    if (!/^(video|audio)\/|application\/octet-stream/i.test(ctype)) {
      return jsonError(502, "PROVIDER_ERROR", "Sumber media mengembalikan tipe konten yang tidak terduga.");
    }

    // Enforce byte cap while streaming.
    let sent = 0;
    const capped = upstream.body.pipeThrough(
      new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, ctrl) {
          sent += chunk.byteLength;
          if (sent > MAX_BYTES) ctrl.error(new Error("too large"));
          else ctrl.enqueue(chunk);
        },
      }),
    );
    const filename = `am-preset-${id}${isAudio ? ".mp3" : type === "hd" ? "-hd.mp4" : ".mp4"}`;
    return new Response(capped, {
      status: 200,
      headers: {
        "content-type": isAudio ? "audio/mpeg" : "video/mp4",
        "content-disposition": `attachment; filename="${filename}"`,
        ...(Number.isFinite(len) && len > 0 ? { "content-length": String(len) } : {}),
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (err) {
    return handleError(err, "download");
  }
}
