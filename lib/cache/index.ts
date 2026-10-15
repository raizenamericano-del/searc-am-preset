import type { ExtractionReport, SearchResponse, VideoItem } from "@/types";
import { createTtlCache } from "./ttl-cache";

const ttlMinutes = Math.min(Math.max(Number(process.env.CACHE_TTL_MINUTES) || 12, 1), 60);
const TTL = ttlMinutes * 60_000;

export const searchCache = createTtlCache<SearchResponse>({ name: "search", max: 300, ttlMs: TTL });
export const videoCache = createTtlCache<VideoItem>({ name: "video", max: 500, ttlMs: TTL });
export const extractionCache = createTtlCache<ExtractionReport>({ name: "extract", max: 500, ttlMs: TTL });
export const shortlinkCache = createTtlCache<string>({ name: "shortlink", max: 1000, ttlMs: TTL });

export { normalizeQueryKey } from "./ttl-cache";
