import "server-only";
import { NextResponse } from "next/server";
import type { ApiErrorBody, ApiErrorCode } from "@/types";
import { isProviderError } from "@/lib/api/errors";
import { getClientKey } from "@/lib/security/client-ip";
import { apiRateLimiter, globalRateLimiter } from "@/lib/security/rate-limit";

export const MAX_BODY_BYTES = 8 * 1024;

export function jsonError(status: number, code: ApiErrorCode, message: string, hint?: string, headers?: HeadersInit) {
  const body: ApiErrorBody = { error: { code, message, ...(hint ? { hint } : {}) } };
  return NextResponse.json(body, { status, headers });
}

export function jsonOk<T>(data: T, cache?: "hit" | "miss") {
  const headers: Record<string, string> = {};
  // cache status is useful for debugging; it reveals nothing about cached content
  if (cache && process.env.EXPOSE_CACHE_HEADER !== "false") headers["x-cache"] = cache.toUpperCase();
  return NextResponse.json(data, { status: 200, headers });
}

/** Read a JSON body with a hard byte limit and malformed-JSON handling. */
export async function readJson(req: Request): Promise<{ ok: true; data: unknown } | { ok: false; res: NextResponse }> {
  const ctype = req.headers.get("content-type") ?? "";
  if (!ctype.toLowerCase().includes("application/json")) {
    return { ok: false, res: jsonError(415, "BAD_REQUEST", "Content-Type harus application/json.") };
  }
  const declared = Number(req.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    return { ok: false, res: jsonError(413, "PAYLOAD_TOO_LARGE", "Permintaan terlalu besar.") };
  }
  let text: string;
  try {
    const buf = await req.arrayBuffer();
    if (buf.byteLength > MAX_BODY_BYTES) return { ok: false, res: jsonError(413, "PAYLOAD_TOO_LARGE", "Permintaan terlalu besar.") };
    text = new TextDecoder().decode(buf);
  } catch {
    return { ok: false, res: jsonError(400, "INVALID_JSON", "Body permintaan tidak dapat dibaca.") };
  }
  try {
    return { ok: true, data: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, res: jsonError(400, "INVALID_JSON", "Format JSON tidak valid.") };
  }
}

/** Returns a 429 response when the caller exceeded the rate limit, otherwise null. */
export function rateLimit(req: Request, cost = 1): NextResponse | null {
  const key = getClientKey(req.headers);
  const limiter = key === "global" ? globalRateLimiter : apiRateLimiter;
  const r = limiter.check(key, cost);
  if (r.allowed) return null;
  return jsonError(429, "RATE_LIMITED", "Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.", undefined, {
    "retry-after": String(r.retryAfterSec),
  });
}

/** Map any thrown error to a safe JSON response (no stack traces, no internals). */
export function handleError(err: unknown, context: string): NextResponse {
  if (isProviderError(err)) {
    switch (err.kind) {
      case "not_found":
        return jsonError(404, "NOT_FOUND", err.publicMessage);
      case "timeout":
        return jsonError(504, "PROVIDER_TIMEOUT", err.publicMessage, "Coba lagi beberapa saat lagi.");
      case "rate_limited":
        return jsonError(503, "PROVIDER_RATE_LIMITED", err.publicMessage, "Provider membatasi ±1 permintaan/detik.", { "retry-after": "3" });
      case "blocked":
        return jsonError(
          503,
          "PROVIDER_BLOCKED",
          err.publicMessage,
          "Endpoint ini diblokir provider untuk IP server. Gunakan mode Tautan Video, atau atur SEARCH_FALLBACK_BASE_URL.",
        );
      case "unsupported":
        return jsonError(501, "UNSUPPORTED", err.publicMessage);
      default:
        console.error(`[${context}] provider error: ${err.kind}`);
        return jsonError(502, "PROVIDER_ERROR", err.publicMessage, "Coba lagi nanti.");
    }
  }
  console.error(`[${context}] unexpected error: ${err instanceof Error ? err.name : "unknown"}`);
  return jsonError(500, "INTERNAL", "Terjadi kesalahan pada server.");
}
