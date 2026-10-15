import { z } from "zod";
import type { SearchMode } from "@/types";
import { createLocalStore } from "./local-store";

export const HISTORY_LIMIT = 8;

const itemSchema = z.object({
  id: z.string().max(64),
  mode: z.enum(["link", "keyword", "creator"]),
  query: z.string().min(1).max(300),
  at: z.number().int().nonnegative(),
});
export type HistoryItem = z.infer<typeof itemSchema>;

export function validateHistory(data: unknown): HistoryItem[] | null {
  if (!Array.isArray(data)) return null;
  // keep valid entries, drop broken ones instead of discarding everything
  return data.flatMap((d) => {
    const r = itemSchema.safeParse(d);
    return r.success ? [r.data] : [];
  }).slice(0, HISTORY_LIMIT);
}

/** Pure: add a search to history (most recent first, identical entries de-duplicated, max 8). */
export function addHistory(list: HistoryItem[], mode: SearchMode, rawQuery: string, now = Date.now()): HistoryItem[] {
  const query = rawQuery.trim().slice(0, 300);
  if (!query) return list;
  const norm = (q: string) => q.trim().toLowerCase();
  const rest = list.filter((h) => !(h.mode === mode && norm(h.query) === norm(query)));
  return [{ id: `${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`, mode, query, at: now }, ...rest].slice(0, HISTORY_LIMIT);
}

export function removeHistory(list: HistoryItem[], id: string): HistoryItem[] {
  return list.filter((h) => h.id !== id);
}

export const historyStore = createLocalStore<HistoryItem[]>({
  key: "amp:history",
  version: 1,
  fallback: [],
  validate: validateHistory,
});
