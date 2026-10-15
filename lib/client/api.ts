import type { ApiErrorBody, ApiErrorCode } from "@/types";

export class ApiClientError extends Error {
  readonly code: ApiErrorCode | "NETWORK" | "ABORTED";
  readonly status: number;
  readonly hint?: string;
  constructor(code: ApiClientError["code"], message: string, status = 0, hint?: string) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
    this.hint = hint;
  }
}

function isErrorBody(v: unknown): v is ApiErrorBody {
  return typeof v === "object" && v !== null && "error" in v && typeof (v as ApiErrorBody).error?.message === "string";
}

/** POST JSON to our own API (relative URL — works behind any proxy/preview host). */
export async function apiPost<T>(path: `/api/${string}`, body: unknown, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (signal?.aborted || (err instanceof DOMException && err.name === "AbortError")) {
      throw new ApiClientError("ABORTED", "Permintaan dibatalkan.");
    }
    throw new ApiClientError("NETWORK", "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.");
  }
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON */
  }
  if (!res.ok) {
    if (isErrorBody(data)) throw new ApiClientError(data.error.code, data.error.message, res.status, data.error.hint);
    throw new ApiClientError("INTERNAL", `Server mengembalikan status ${res.status}.`, res.status);
  }
  return data as T;
}

export async function apiGet<T>(path: `/api/${string}`, signal?: AbortSignal): Promise<T> {
  const res = await fetch(path, { signal, cache: "no-store" });
  if (!res.ok) throw new ApiClientError("INTERNAL", `Status ${res.status}`, res.status);
  return (await res.json()) as T;
}
