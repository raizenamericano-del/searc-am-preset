import { describe, expect, it, vi } from "vitest";
import { createTikwmProvider, normalizeTikwmVideo, unwrapTikwm } from "@/lib/api/tikwm";
import { ProviderError } from "@/lib/api/errors";
import { providerJson } from "@/lib/api/http";

const RAW = {
  id: "7106594312292453675",
  title: "preset am 👉 alight.link/abc",
  cover: "https://p16-common-sign.tiktokcdn-us.com/x.jpeg",
  duration: 24,
  play: "https://v16m.tiktokcdn-us.com/video.mp4",
  music: "https://v16-ies-music.tiktokcdn-us.com/a.mp3",
  play_count: 591559,
  digg_count: 98917,
  author: { id: "1", unique_id: "kreator", nickname: "Kreator", avatar: "https://evil.example.com/a.jpg" },
};

const json = (body: unknown, init: ResponseInit = {}) => new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" }, ...init });

function provider(fetchImpl: typeof fetch) {
  return createTikwmProvider({ fetchImpl, minIntervalMs: 0, timeoutMs: 200 });
}

describe("normalizeTikwmVideo", () => {
  it("maps fields, keeps missing stats as null and drops non-allow-listed media hosts", () => {
    const n = normalizeTikwmVideo(RAW, "https://www.tikwm.com")!;
    expect(n.video).toMatchObject({ id: RAW.id, caption: RAW.title, duration: 24, url: `https://www.tiktok.com/@kreator/video/${RAW.id}` });
    expect(n.video.stats).toEqual({ views: 591559, likes: 98917, comments: null, shares: null });
    expect(n.video.author.avatar).toBeNull(); // evil.example.com not allowed
    expect(n.video.captionPresetCount).toBe(1);
    expect(n.video.media).toMatchObject({ video: true, audio: true, videoHd: false });
  });
  it("resolves relative tikwm media paths", () => {
    const n = normalizeTikwmVideo({ ...RAW, video_id: RAW.id, id: undefined, cover: "/video/cover/1.webp" }, "https://www.tikwm.com")!;
    expect(n.video.cover).toBe("https://www.tikwm.com/video/cover/1.webp");
  });
  it("returns null for unusable objects", () => {
    expect(normalizeTikwmVideo(null, "https://www.tikwm.com")).toBeNull();
    expect(normalizeTikwmVideo({ id: "abc" }, "https://www.tikwm.com")).toBeNull();
  });
});

describe("unwrapTikwm", () => {
  it("translates provider error messages", () => {
    expect(() => unwrapTikwm({ code: -1, msg: "Url parsing is failed! Please check url." })).toThrow(expect.objectContaining({ kind: "not_found" }));
    expect(() => unwrapTikwm({ code: -1, msg: "Free Api Limit: 1 request/second." })).toThrow(expect.objectContaining({ kind: "rate_limited" }));
    expect(() => unwrapTikwm("nope")).toThrow(expect.objectContaining({ kind: "bad_response" }));
  });
});

describe("TikWM provider (mocked network)", () => {
  it("gets video details", async () => {
    const f = vi.fn().mockResolvedValue(json({ code: 0, msg: "success", data: RAW }));
    const { video } = await provider(f as never).getVideoDetails("https://www.tiktok.com/@kreator/video/7106594312292453675");
    expect(video.playUrl).toBe(RAW.play);
    expect(f.mock.calls[0]?.[0]).toBe("https://www.tikwm.com/api/");
  });

  it("detects Cloudflare/HTML challenge as blocked", async () => {
    const f = vi.fn().mockResolvedValue(new Response("<!DOCTYPE html><title>Just a moment...</title>", { status: 403, headers: { "content-type": "text/html" } }));
    await expect(provider(f as never).searchVideos("preset", null)).rejects.toMatchObject({ kind: "blocked" });
  });

  it("handles malformed JSON", async () => {
    const f = vi.fn().mockResolvedValue(new Response("{not json", { status: 200, headers: { "content-type": "application/json" } }));
    await expect(provider(f as never).getVideoDetails("7106594312292453675")).rejects.toMatchObject({ kind: "bad_response" });
  });

  it("times out slow providers", async () => {
    const f = vi.fn((_u: string, init: RequestInit) => new Promise<Response>((_, rej) => init.signal?.addEventListener("abort", () => rej(new DOMException("aborted", "AbortError")))));
    await expect(provider(f as never).getVideoDetails("7106594312292453675")).rejects.toMatchObject({ kind: "timeout" });
  });

  it("maps HTTP 429 and 5xx", async () => {
    await expect(provider(vi.fn().mockResolvedValue(json({}, { status: 429 })) as never).getVideoDetails("7106594312292453675")).rejects.toMatchObject({ kind: "rate_limited" });
    await expect(provider(vi.fn().mockResolvedValue(json({}, { status: 502 })) as never).getVideoDetails("7106594312292453675")).rejects.toMatchObject({ kind: "upstream" });
  });

  it("normalises search lists with cursor and de-duplicates", async () => {
    const f = vi.fn().mockResolvedValue(json({ code: 0, data: { videos: [RAW, RAW, { bad: true }], cursor: "20", hasMore: true } }));
    const r = await provider(f as never).searchVideos("preset am", null);
    expect(r.items).toHaveLength(1);
    expect(r).toMatchObject({ mode: "keyword", cursor: "20", hasMore: true });
  });

  it("returns empty lists without failing", async () => {
    const f = vi.fn().mockResolvedValue(json({ code: 0, data: { videos: [], cursor: "0", hasMore: false } }));
    const r = await provider(f as never).getCreatorVideos("kreator", null);
    expect(r).toMatchObject({ items: [], hasMore: false, cursor: null });
  });

  it("parses comments", async () => {
    const f = vi.fn().mockResolvedValue(json({ code: 0, data: { comments: [{ id: "1", text: "link s.id/x", user: { unique_id: "kreator" } }, { id: "2", text: "" }], total: 2 } }));
    const n = normalizeTikwmVideo(RAW, "https://www.tikwm.com")!;
    const page = await provider(f as never).getComments(n.video);
    expect(page.comments).toEqual([{ id: "1", text: "link s.id/x", authorUsername: "kreator" }]);
  });

  it("rejects oversized responses", async () => {
    const big = "x".repeat(2000);
    await expect(providerJson({ url: "https://x.test", fetchImpl: vi.fn().mockResolvedValue(new Response(big)) as never, maxBytes: 100 })).rejects.toBeInstanceOf(ProviderError);
  });
});
