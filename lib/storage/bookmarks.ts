import { z } from "zod";
import type { PresetLink, PresetPlatform } from "@/types";
import { canonicalizeUrl, classifyUrl } from "@/lib/extractor/patterns";
import { createLocalStore } from "./local-store";

export const BOOKMARK_LIMIT = 500;

const bookmarkSchema = z.object({
  id: z.string().min(1).max(120),
  url: z.string().url().max(2048),
  canonicalUrl: z.string().max(2048),
  platform: z.enum(["alight_motion", "xml_pack", "capcut", "vn", "other"]),
  domain: z.string().max(253),
  validation: z.enum(["verified", "candidate", "resolved", "unchecked", "blocked"]).optional(),
  videoId: z.string().max(32).optional(),
  videoCaption: z.string().max(200).optional(),
  author: z.string().max(40).optional(),
  savedAt: z.number().int().nonnegative(),
});
export type Bookmark = z.infer<typeof bookmarkSchema>;

export function validateBookmarks(data: unknown): Bookmark[] | null {
  if (!Array.isArray(data)) return null;
  const seen = new Set<string>();
  const out: Bookmark[] = [];
  for (const d of data) {
    const r = bookmarkSchema.safeParse(d);
    if (!r.success || !/^https?:/i.test(r.data.url) || seen.has(r.data.id)) continue;
    seen.add(r.data.id);
    out.push(r.data);
  }
  return out.slice(0, BOOKMARK_LIMIT);
}

/** Stable bookmark ID derived from the canonical URL. */
export function bookmarkId(url: string): string {
  try {
    return `bm:${canonicalizeUrl(new URL(url))}`.slice(0, 120);
  } catch {
    return `bm:${url}`.slice(0, 120);
  }
}

export interface BookmarkInput {
  url: string;
  platform?: PresetPlatform;
  validation?: PresetLink["validation"];
  videoId?: string;
  videoCaption?: string;
  author?: string;
}

/** Pure: add (no duplicates — same canonical URL is kept once, newest first). */
export function addBookmark(list: Bookmark[], input: BookmarkInput, now = Date.now()): Bookmark[] {
  let parsed: URL;
  try {
    parsed = new URL(input.url);
  } catch {
    return list;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return list;
  const id = bookmarkId(input.url);
  if (list.some((b) => b.id === id)) return list;
  const bm: Bookmark = {
    id,
    url: parsed.toString(),
    canonicalUrl: canonicalizeUrl(parsed),
    platform: input.platform ?? classifyUrl(parsed)?.platform ?? "other",
    domain: parsed.hostname.replace(/^www\./, ""),
    validation: input.validation,
    videoId: input.videoId,
    videoCaption: input.videoCaption?.slice(0, 200),
    author: input.author?.slice(0, 40),
    savedAt: now,
  };
  return [bm, ...list].slice(0, BOOKMARK_LIMIT);
}

export function removeBookmark(list: Bookmark[], id: string): Bookmark[] {
  return list.filter((b) => b.id !== id);
}

export function filterBookmarks(list: Bookmark[], query: string, platform: PresetPlatform | "all"): Bookmark[] {
  const q = query.trim().toLowerCase();
  return list.filter(
    (b) =>
      (platform === "all" || b.platform === platform) &&
      (!q || [b.url, b.domain, b.videoCaption ?? "", b.author ?? ""].some((f) => f.toLowerCase().includes(q))),
  );
}

export const bookmarkStore = createLocalStore<Bookmark[]>({
  key: "amp:bookmarks",
  version: 1,
  fallback: [],
  validate: validateBookmarks,
});
