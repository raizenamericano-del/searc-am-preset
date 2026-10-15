"use client";
import { useCallback } from "react";
import type { SearchMode } from "@/types";
import { addHistory, historyStore, removeHistory } from "@/lib/storage/history";
import { useLocalStore } from "./use-local-store";

export function useHistory() {
  const items = useLocalStore(historyStore);
  const add = useCallback((mode: SearchMode, query: string) => historyStore.set((p) => addHistory(p, mode, query)), []);
  const remove = useCallback((id: string) => historyStore.set((p) => removeHistory(p, id)), []);
  const clear = useCallback(() => historyStore.set([]), []);
  return { items, add, remove, clear };
}
