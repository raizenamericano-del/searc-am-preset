import "server-only";
import { LRUCache } from "lru-cache";
import type { MediaSources } from "@/lib/api/types";

/** Short-lived map videoId → provider media URLs (never sent raw to the client for download). */
export const mediaStore = new LRUCache<string, MediaSources>({ max: 1000, ttl: 30 * 60_000 });
