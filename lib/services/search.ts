import "server-only";
import type { SearchMode, SearchResponse } from "@/types";
import { getProvider, getSearchFallback, tracked } from "@/lib/api";
import { isProviderError, ProviderError } from "@/lib/api/errors";
import { normalizeQueryKey, searchCache, videoCache } from "@/lib/cache";
import { mediaStore } from "./media-store";

export interface SearchOutcome {
  data: SearchResponse;
  cache: "hit" | "miss";
}

/** Keyword / creator search with cache, fallback provider and honest failure modes. */
export async function runListSearch(mode: Exclude<SearchMode, "link">, query: string, cursor: string | null): Promise<SearchOutcome> {
  const provider = getProvider();
  const key = `${provider.name}:${mode}:${normalizeQueryKey(query)}:${cursor ?? "0"}`;
  const feature = mode === "keyword" ? "keywordSearch" : "creatorVideos";

  const exec = async (p: typeof provider) => {
    if (mode === "keyword" ? !p.capabilities.keywordSearch : !p.capabilities.creatorVideos) {
      throw new ProviderError("unsupported", "Provider aktif tidak mendukung mode pencarian ini.");
    }
    return mode === "keyword" ? p.searchVideos(query, cursor, 20) : p.getCreatorVideos(query, cursor, 20);
  };

  const { value, hit } = await searchCache.getOrSet(key, async () => {
    let res;
    try {
      res = await tracked(feature, () => exec(provider));
    } catch (err) {
      const fb = getSearchFallback();
      if (fb && isProviderError(err) && ["blocked", "unsupported", "upstream", "timeout"].includes(err.kind)) {
        res = await exec(fb);
      } else {
        throw err;
      }
    }
    for (const item of res.items) {
      const m = res.media[item.id];
      if (m) mediaStore.set(item.id, m);
      if (!videoCache.has(item.id)) videoCache.set(item.id, item);
    }
    const { media: _media, ...clean } = res;
    return clean;
  });
  return { data: value, cache: hit ? "hit" : "miss" };
}
