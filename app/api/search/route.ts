import { runListSearch } from "@/lib/services/search";
import { handleError, jsonError, jsonOk, rateLimit, readJson } from "@/lib/server/respond";
import { firstIssue, searchSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const limited = rateLimit(req);
  if (limited) return limited;
  const body = await readJson(req);
  if (!body.ok) return body.res;
  const parsed = searchSchema.safeParse(body.data);
  if (!parsed.success) return jsonError(400, "BAD_REQUEST", firstIssue(parsed.error));
  try {
    const { mode, query, cursor } = parsed.data;
    const { data, cache } = await runListSearch(mode, query, cursor);
    return jsonOk(data, cache);
  } catch (err) {
    return handleError(err, "search");
  }
}
