import { LRUCache } from "lru-cache";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

interface Bucket {
  tokens: number;
  updatedAt: number;
}

/**
 * Token-bucket rate limiter kept in a bounded LRU (memory per instance).
 * `capacity` requests burst, refilled at `refillPerMinute`.
 */
export function createRateLimiter(opts: { capacity: number; refillPerMinute: number; maxKeys?: number; now?: () => number }) {
  const buckets = new LRUCache<string, Bucket>({ max: opts.maxKeys ?? 5000, ttl: 10 * 60_000 });
  const now = opts.now ?? Date.now;
  const ratePerMs = opts.refillPerMinute / 60_000;

  return {
    check(key: string, cost = 1): RateLimitResult {
      const t = now();
      const prev = buckets.get(key) ?? { tokens: opts.capacity, updatedAt: t };
      const tokens = Math.min(opts.capacity, prev.tokens + (t - prev.updatedAt) * ratePerMs);
      if (tokens < cost) {
        buckets.set(key, { tokens, updatedAt: t });
        return { allowed: false, remaining: 0, retryAfterSec: Math.max(1, Math.ceil((cost - tokens) / ratePerMs / 1000)) };
      }
      buckets.set(key, { tokens: tokens - cost, updatedAt: t });
      return { allowed: true, remaining: Math.floor(tokens - cost), retryAfterSec: 0 };
    },
    reset() {
      buckets.clear();
    },
  };
}

const perMinute = Number(process.env.RATE_LIMIT_PER_MINUTE) || 30;

/** Shared limiter for API routes. "global" (unknown client) gets a larger shared bucket. */
export const apiRateLimiter = createRateLimiter({ capacity: Math.max(5, Math.ceil(perMinute / 2)), refillPerMinute: perMinute });
export const globalRateLimiter = createRateLimiter({ capacity: perMinute * 3, refillPerMinute: perMinute * 6 });
