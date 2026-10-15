"use client";
import { useCallback, useEffect, useState } from "react";
import type { ExtractionReport } from "@/types";
import { ApiClientError, apiPost } from "@/lib/client/api";

export type ExtractionState =
  | { status: "loading" }
  | { status: "success"; report: ExtractionReport }
  | { status: "error"; error: ApiClientError };

type Settled = { key: string; state: Exclude<ExtractionState, { status: "loading" }> };

/** Loading is derived (no synchronous setState in the effect): a result only counts for the current request key. */
export function useExtraction(videoId: string | null) {
  const [nonce, setNonce] = useState(0);
  const [settled, setSettled] = useState<Settled | null>(null);
  const key = `${videoId ?? ""}:${nonce}`;

  useEffect(() => {
    if (!videoId) return;
    const controller = new AbortController();
    apiPost<{ extraction: ExtractionReport }>("/api/extract", { videoId }, controller.signal)
      .then((r) => {
        if (!controller.signal.aborted) setSettled({ key, state: { status: "success", report: r.extraction } });
      })
      .catch((err: unknown) => {
        const e = err instanceof ApiClientError ? err : new ApiClientError("INTERNAL", "Gagal memindai preset.");
        if (e.code !== "ABORTED" && !controller.signal.aborted) setSettled({ key, state: { status: "error", error: e } });
      });
    return () => controller.abort();
  }, [videoId, key]);

  const retry = useCallback(() => setNonce((n) => n + 1), []);
  const state: ExtractionState = settled && settled.key === key ? settled.state : { status: "loading" };
  return { state, retry };
}
