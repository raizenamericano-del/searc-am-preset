"use client";
import { Download, Music2, Scale } from "lucide-react";
import { useState } from "react";
import type { VideoItem } from "@/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatBytes } from "@/lib/utils/format";

type Kind = "video" | "hd" | "audio";

/** Download buttons appear only for media the provider actually returned. Files are streamed, never stored server-side. */
export function MediaDownloads({ video }: { video: VideoItem }) {
  const toast = useToast();
  const [busy, setBusy] = useState<Kind | null>(null);
  const [progress, setProgress] = useState<number | null>(null);

  const download = async (kind: Kind) => {
    setBusy(kind);
    setProgress(null);
    try {
      const res = await fetch(`/api/download?id=${encodeURIComponent(video.id)}&type=${kind}`);
      if (!res.ok || !res.body) {
        let msg = "Unduhan gagal.";
        try {
          const j = (await res.json()) as { error?: { message?: string } };
          if (j.error?.message) msg = j.error.message;
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }
      const total = Number(res.headers.get("content-length")) || 0;
      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      let got = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        got += value.byteLength;
        if (total) setProgress(Math.round((got / total) * 100));
      }
      const blob = new Blob(chunks as BlobPart[], { type: kind === "audio" ? "audio/mpeg" : "video/mp4" });
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `am-preset-${video.id}${kind === "audio" ? ".mp3" : kind === "hd" ? "-hd.mp4" : ".mp4"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(href), 10_000);
      toast("Unduhan selesai.", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Unduhan gagal.", "error");
    } finally {
      setBusy(null);
      setProgress(null);
    }
  };

  const { media } = video;
  if (!media.video && !media.audio && !media.videoHd) {
    return <p className="text-xs text-ink-dim">Provider tidak menyediakan file media untuk video ini.</p>;
  }
  const label = (base: string, k: Kind) => (busy === k ? (progress !== null ? `${base} ${progress}%` : `${base}…`) : base);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {media.video && (
          <Button size="sm" loading={busy === "video"} disabled={busy !== null} onClick={() => void download("video")} icon={<Download className="h-4 w-4" aria-hidden />}>
            {label("Unduh Video", "video")}
            {formatBytes(media.videoSizeBytes) && busy !== "video" && <span className="text-ink-dim">· {formatBytes(media.videoSizeBytes)}</span>}
          </Button>
        )}
        {media.videoHd && (
          <Button size="sm" loading={busy === "hd"} disabled={busy !== null} onClick={() => void download("hd")} icon={<Download className="h-4 w-4" aria-hidden />}>
            {label("Video HD", "hd")}
          </Button>
        )}
        {media.audio && (
          <Button size="sm" loading={busy === "audio"} disabled={busy !== null} onClick={() => void download("audio")} icon={<Music2 className="h-4 w-4" aria-hidden />}>
            {label("Unduh Audio", "audio")}
          </Button>
        )}
      </div>
      <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-ink-dim">
        <Scale className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
        Unduh hanya untuk penggunaan pribadi. Hormati hak cipta kreator serta ketentuan layanan TikTok. Ketersediaan file (termasuk versi tanpa watermark) sepenuhnya bergantung pada provider.
      </p>
    </div>
  );
}
