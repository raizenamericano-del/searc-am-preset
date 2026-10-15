import { describe, expect, it } from "vitest";
import { createTtlCache, normalizeQueryKey } from "@/lib/cache/ttl-cache";
import { createRateLimiter } from "@/lib/security/rate-limit";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("createTtlCache", () => {
  it("returns hit on second call", async () => {
    const c = createTtlCache<string>({ name: "t", max: 10, ttlMs: 10_000 });
    let calls = 0;
    const f = async () => `v${++calls}`;
    expect(await c.getOrSet("k", f)).toEqual({ value: "v1", hit: false });
    expect(await c.getOrSet("k", f)).toEqual({ value: "v1", hit: true });
    expect(c.stats()).toMatchObject({ hits: 1, misses: 1, size: 1 });
  });
  it("expires entries after TTL", async () => {
    const c = createTtlCache<string>({ name: "t", max: 10, ttlMs: 40 });
    c.set("k", "v");
    expect(c.get("k")).toBe("v");
    await sleep(80);
    expect(c.get("k")).toBeUndefined();
  });
  it("evicts least-recently-used entries beyond max", () => {
    const c = createTtlCache<string>({ name: "t", max: 2, ttlMs: 10_000 });
    c.set("a", "1");
    c.set("b", "2");
    c.get("a");
    c.set("c", "3");
    expect(c.has("b")).toBe(false);
    expect(c.has("a")).toBe(true);
    expect(c.stats().size).toBe(2);
  });
  it("never caches errors", async () => {
    const c = createTtlCache<string>({ name: "t", max: 10, ttlMs: 10_000 });
    await expect(c.getOrSet("k", async () => { throw new Error("x"); })).rejects.toThrow("x");
    expect(c.has("k")).toBe(false);
    expect((await c.getOrSet("k", async () => "ok")).value).toBe("ok");
  });
  it("de-duplicates concurrent computations", async () => {
    const c = createTtlCache<string>({ name: "t", max: 10, ttlMs: 10_000 });
    let calls = 0;
    const f = async () => { calls++; await sleep(10); return "v"; };
    await Promise.all([c.getOrSet("k", f), c.getOrSet("k", f), c.getOrSet("k", f)]);
    expect(calls).toBe(1);
  });
  it("normalises query keys", () => {
    expect(normalizeQueryKey("  Preset   AM  ")).toBe(normalizeQueryKey("preset am"));
  });
});

describe("createRateLimiter", () => {
  it("allows a burst then blocks, then refills", () => {
    let t = 0;
    const rl = createRateLimiter({ capacity: 3, refillPerMinute: 60, now: () => t });
    expect([rl.check("ip"), rl.check("ip"), rl.check("ip")].every((r) => r.allowed)).toBe(true);
    const blocked = rl.check("ip");
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThanOrEqual(1);
    expect(rl.check("other").allowed).toBe(true);
    t += 1000;
    expect(rl.check("ip").allowed).toBe(true);
  });
});
