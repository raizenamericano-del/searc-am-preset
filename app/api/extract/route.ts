import { extractForVideo, extractFromText } from "@/lib/services/video";
import { handleError, jsonError, jsonOk, rateLimit, readJson } from "@/lib/server/respond";
import { extractSchema, firstIssue } from "@/lib/validation/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const limited = rateLimit(req, 2);
  if (limited) return limited;
  const body = await readJson(req);
  if (!body.ok) return body.res;
  const parsed = extractSchema.safeParse(body.data);
  if (!parsed.success) return jsonError(400, "BAD_REQUEST", firstIssue(parsed.error));
  try {
    if ("videoId" in parsed.data) {
      const { report, cache } = await extractForVideo(parsed.data.videoId);
      return jsonOk({ extraction: report }, cache);
    }
    const result = await extractFromText(parsed.data.text);
    return jsonOk(result);
  } catch (err) {
    return handleError(err, "extract");
  }
}
