import "server-only";
import { ProviderError } from "./errors";

export interface ProviderRequest {
  url: string;
  method?: "GET" | "POST";
  form?: Record<string, string>;
  timeoutMs?: number;
  maxBytes?: number;
  fetchImpl?: typeof fetch;
}

const UA = "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36";

async function readLimited(res: Response, maxBytes: number): Promise<string> {
  const len = Number(res.headers.get("content-length"));
  if (Number.isFinite(len) && len > maxBytes) throw new ProviderError("bad_response", "Respons provider terlalu besar.");
  if (!res.body) return "";
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new ProviderError("bad_response", "Respons provider terlalu besar.");
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

/** JSON request to a provider with timeout, size cap and anti-bot (HTML challenge) detection. */
export async function providerJson(req: ProviderRequest): Promise<unknown> {
  const doFetch = req.fetchImpl ?? fetch;
  const timeoutMs = req.timeoutMs ?? 10_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    const body = req.form ? new URLSearchParams(req.form).toString() : undefined;
    res = await doFetch(req.url, {
      method: req.method ?? (body ? "POST" : "GET"),
      body,
      headers: {
        "user-agent": UA,
        accept: "application/json",
        ...(body ? { "content-type": "application/x-www-form-urlencoded; charset=UTF-8" } : {}),
      },
      signal: controller.signal,
      redirect: "error",
      cache: "no-store",
    });
  } catch (err) {
    clearTimeout(timer);
    if (controller.signal.aborted) throw new ProviderError("timeout", "Provider tidak merespons tepat waktu.");
    throw new ProviderError("network", "Gagal menghubungi provider.", String(err));
  }
  try {
    const ctype = res.headers.get("content-type") ?? "";
    const text = await readLimited(res, req.maxBytes ?? 3_000_000);
    const looksHtml = ctype.includes("text/html") || /^\s*<(!doctype|html)/i.test(text);
    if (looksHtml) {
      throw new ProviderError(
        "blocked",
        "Provider memblokir permintaan dari server ini (anti-bot challenge).",
        `HTML response status=${res.status}`,
      );
    }
    if (res.status === 429) throw new ProviderError("rate_limited", "Batas permintaan provider tercapai. Coba lagi sebentar.");
    if (res.status >= 500) throw new ProviderError("upstream", "Provider sedang bermasalah.", `status=${res.status}`);
    try {
      return JSON.parse(text) as unknown;
    } catch {
      throw new ProviderError("bad_response", "Respons provider tidak valid.");
    }
  } catch (err) {
    if (controller.signal.aborted) throw new ProviderError("timeout", "Provider tidak merespons tepat waktu.");
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
