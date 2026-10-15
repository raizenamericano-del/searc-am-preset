"use client";
import { useCallback, useRef, useState } from "react";
import type { SearchMode, SearchResponse, VideoItem } from "@/types";
import { ApiClientError, apiPost } from "@/lib/client/api";

export type SearchStage = "contacting" | "metadata";

export type SearchState =
  | { status: "idle" }
  | { status: "loading"; mode: SearchMode; query: string; stage: SearchStage }
  | { status: "error"; mode: SearchMode; query: string; error: ApiClientError }
  | { status: "success"; mode: "keyword" | "creator"; query: string; items: VideoItem[]; cursor: string | null; hasMore: boolean; loadingMore: boolean; moreError: ApiClientError | null }
  | { status: "success-link"; mode: "link"; query: string; video: VideoItem };

/**
 * Search controller: cancels stale requests (AbortController) and guards
 * against out-of-order responses with a monotonically increasing request id.
 */
export function useSearch() {
  const [state, setState] = useState<SearchState>({ status: "idle" });
  const ctrl = useRef<AbortController | null>(null);
  const reqId = useRef(0);

  const run = useCallback(async (mode: SearchMode, query: string) => {
    ctrl.current?.abort();
    const controller = new AbortController();
    ctrl.current = controller;
    const id = ++reqId.current;
    const set = (s: SearchState) => {
      if (id === reqId.current) setState(s);
    };
    // client-side validation already happened in the form before run() is called
    set({ status: "loading", mode, query, stage: mode === "link" ? "metadata" : "contacting" });
    try {
      if (mode === "link") {
        const { video } = await apiPost<{ video: VideoItem }>("/api/video", { input: query }, controller.signal);
        set({ status: "success-link", mode, query, video });
        return;
      }
      const data = await apiPost<SearchResponse>("/api/search", { mode, query }, controller.signal);
      set({ status: "success", mode, query: data.query, items: data.items, cursor: data.cursor, hasMore: data.hasMore, loadingMore: false, moreError: null });
    } catch (err) {
      const e = err instanceof ApiClientError ? err : new ApiClientError("INTERNAL", "Terjadi kesalahan tak terduga.");
      if (e.code === "ABORTED") return;
      set({ status: "error", mode, query, error: e });
    }
  }, []);

  const loadMore = useCallback(async () => {
    const current = state;
    if (current.status !== "success" || !current.hasMore || !current.cursor || current.loadingMore) return;
    const id = reqId.current;
    const controller = new AbortController();
    ctrl.current = controller;
    setState({ ...current, loadingMore: true, moreError: null });
    try {
      const data = await apiPost<SearchResponse>("/api/search", { mode: current.mode, query: current.query, cursor: current.cursor }, controller.signal);
      if (id !== reqId.current) return;
      const seen = new Set(current.items.map((i) => i.id));
      setState({
        ...current,
        items: [...current.items, ...data.items.filter((i) => !seen.has(i.id))],
        cursor: data.cursor,
        hasMore: data.hasMore,
        loadingMore: false,
        moreError: null,
      });
    } catch (err) {
      if (id !== reqId.current) return;
      const e = err instanceof ApiClientError ? err : new ApiClientError("INTERNAL", "Gagal memuat lebih banyak.");
      if (e.code === "ABORTED") return;
      setState({ ...current, loadingMore: false, moreError: e });
    }
  }, [state]);

  const reset = useCallback(() => {
    ctrl.current?.abort();
    reqId.current++;
    setState({ status: "idle" });
  }, []);

  return { state, run, loadMore, reset };
}
