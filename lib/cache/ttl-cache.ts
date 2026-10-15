import { LRUCache } from "lru-cache";

export interface TtlCacheOptions {
  name: string;
  max: number;
  ttlMs: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
}

/**
 * Bounded in-memory LRU with TTL + in-flight de-duplication.
 * Only successful values are stored — thrown errors are never cached.
 * NOTE: memory-only; lost on restart and not shared across replicas.
 */
export function createTtlCache<V extends NonNullable<unknown>>(opts: TtlCacheOptions) {
  const lru = new LRUCache<string, V>({ max: opts.max, ttl: opts.ttlMs, updateAgeOnGet: false });
  const inflight = new Map<string, Promise<V>>();
  const stats = { hits: 0, misses: 0 };

  return {
    name: opts.name,
    get(key: string): V | undefined {
      return lru.get(key);
    },
    set(key: string, value: V, ttlMs?: number) {
      lru.set(key, value, ttlMs ? { ttl: ttlMs } : undefined);
    },
    has(key: string) {
      return lru.has(key);
    },
    delete(key: string) {
      lru.delete(key);
    },
    clear() {
      lru.clear();
      inflight.clear();
    },
    /** Returns cached value or computes it. `hit` tells whether it came from cache. */
    async getOrSet(key: string, compute: () => Promise<V>): Promise<{ value: V; hit: boolean }> {
      const cached = lru.get(key);
      if (cached !== undefined) {
        stats.hits++;
        return { value: cached, hit: true };
      }
      stats.misses++;
      const pending = inflight.get(key);
      if (pending) return { value: await pending, hit: false };
      const p = compute()
        .then((value) => {
          lru.set(key, value);
          return value;
        })
        .finally(() => inflight.delete(key));
      inflight.set(key, p);
      return { value: await p, hit: false };
    },
    stats(): CacheStats {
      return { ...stats, size: lru.size };
    },
  };
}

export type TtlCache<V extends NonNullable<unknown>> = ReturnType<typeof createTtlCache<V>>;

/** Normalize a free-text query so identical searches share a cache key. */
export function normalizeQueryKey(q: string): string {
  return q.normalize("NFKC").trim().toLowerCase().replace(/\s+/g, " ");
}
