import { getVideo } from "@/lib/services/video";
import { handleError, jsonError, jsonOk, rateLimit, readJson } from "@/lib/server/respond";
import { firstIssue, videoSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const limited = rateLimit(req);
  if (limited) return limited;
  const body = await readJson(req);
  if (!body.ok) return body.res;
  const parsed = videoSchema.safeParse(body.data);
  if (!parsed.success) return jsonError(400, "BAD_REQUEST", firstIssue(parsed.error));
  try {
    const { video, cache } = await getVideo(parsed.data.input);
    return jsonOk({ video }, cache);
  } catch (err) {
    return handleError(err, "video");
  }
}
