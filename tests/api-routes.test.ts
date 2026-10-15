import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProviderError } from "@/lib/api/errors";

vi.mock("@/lib/services/search", () => ({ runListSearch: vi.fn() }));
vi.mock("@/lib/services/video", () => ({ getVideo: vi.fn(), extractForVideo: vi.fn(), extractFromText: vi.fn() }));

const { runListSearch } = await import("@/lib/services/search");
const { getVideo } = await import("@/lib/services/video");
const search = await import("@/app/api/search/route");
const video = await import("@/app/api/video/route");
const { apiRateLimiter, globalRateLimiter } = await import("@/lib/security/rate-limit");

const req = (body: string, headers: Record<string, string> = {}) =>
  new Request("http://localhost/api/search", { method: "POST", body, headers: { "content-type": "application/json", ...headers } });

beforeEach(() => {
  apiRateLimiter.reset();
  globalRateLimiter.reset();
  vi.mocked(runListSearch).mockReset();
});

describe("POST /api/search", () => {
  it("400 on malformed JSON", async () => {
    const r = await search.POST(req("{oops"));
    expect(r.status).toBe(400);
    expect((await r.json()).error.code).toBe("INVALID_JSON");
  });
  it("415 on wrong content type", async () => {
    const r = await search.POST(new Request("http://localhost/api/search", { method: "POST", body: "x", headers: { "content-type": "text/plain" } }));
    expect(r.status).toBe(415);
  });
  it("413 on oversized body", async () => {
    const r = await search.POST(req(JSON.stringify({ mode: "keyword", query: "x".repeat(10_000) })));
    expect(r.status).toBe(413);
  });
  it("400 on invalid input with a readable message", async () => {
    const r = await search.POST(req(JSON.stringify({ mode: "creator", query: "bad name!" })));
    expect(r.status).toBe(400);
    expect((await r.json()).error.message).toMatch(/Username/);
  });
  it("200 with normalised data + cache header", async () => {
    vi.mocked(runListSearch).mockResolvedValue({ data: { mode: "keyword", query: "preset am", items: [], cursor: null, hasMore: false, provider: "tikwm" }, cache: "miss" });
    const r = await search.POST(req(JSON.stringify({ mode: "keyword", query: "Preset  AM" })));
    expect(r.status).toBe(200);
    expect(r.headers.get("x-cache")).toBe("MISS");
    expect(runListSearch).toHaveBeenCalledWith("keyword", "Preset AM", null);
  });
  it("503 PROVIDER_BLOCKED when provider blocks the endpoint (no internals leaked)", async () => {
    vi.mocked(runListSearch).mockRejectedValue(new ProviderError("blocked", "Provider memblokir permintaan.", "HTML status=403 secret-internal"));
    const r = await search.POST(req(JSON.stringify({ mode: "keyword", query: "preset" })));
    const body = await r.json();
    expect(r.status).toBe(503);
    expect(body.error.code).toBe("PROVIDER_BLOCKED");
    expect(JSON.stringify(body)).not.toContain("secret-internal");
  });
  it("504 on provider timeout, 502 on unexpected provider errors, 500 hides internal errors", async () => {
    vi.mocked(runListSearch).mockRejectedValueOnce(new ProviderError("timeout", "lambat"));
    expect((await search.POST(req(JSON.stringify({ mode: "keyword", query: "preset" })))).status).toBe(504);
    vi.mocked(runListSearch).mockRejectedValueOnce(new ProviderError("bad_response", "rusak"));
    expect((await search.POST(req(JSON.stringify({ mode: "keyword", query: "preset" })))).status).toBe(502);
    vi.mocked(runListSearch).mockRejectedValueOnce(new Error("db password=hunter2"));
    const r = await search.POST(req(JSON.stringify({ mode: "keyword", query: "preset" })));
    expect(r.status).toBe(500);
    expect(await r.text()).not.toContain("hunter2");
  });
  it("429 when rate limit is exceeded", async () => {
    vi.mocked(runListSearch).mockResolvedValue({ data: { mode: "keyword", query: "x", items: [], cursor: null, hasMore: false, provider: "tikwm" }, cache: "hit" });
    let last: Response | null = null;
    for (let i = 0; i < 200; i++) {
      last = await search.POST(req(JSON.stringify({ mode: "keyword", query: "preset" })));
      if (last.status === 429) break;
    }
    expect(last?.status).toBe(429);
    expect(last?.headers.get("retry-after")).toBeTruthy();
  });
});

describe("POST /api/video", () => {
  it("rejects non-TikTok URLs before touching the provider", async () => {
    const r = await video.POST(req(JSON.stringify({ input: "http://169.254.169.254/latest" })));
    expect(r.status).toBe(400);
    expect(getVideo).not.toHaveBeenCalled();
  });
  it("404 when provider cannot find the video", async () => {
    vi.mocked(getVideo).mockRejectedValue(new ProviderError("not_found", "Video tidak ditemukan"));
    const r = await video.POST(req(JSON.stringify({ input: "https://www.tiktok.com/@u/video/7106594312292453675" })));
    expect(r.status).toBe(404);
  });
});
