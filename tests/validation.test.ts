import { describe, expect, it } from "vitest";
import { downloadSchema, extractSchema, searchSchema, videoSchema } from "@/lib/validation/schemas";
import { normalizeUsername, parseTikTokInput } from "@/lib/utils/tiktok-url";

describe("parseTikTokInput", () => {
  it.each([
    ["https://www.tiktok.com/@user.name/video/7106594312292453675?is_from_webapp=1", "video"],
    ["tiktok.com/@user/video/7106594312292453675", "video"],
    ["https://m.tiktok.com/v/7106594312292453675.html", "video"],
    ["https://vt.tiktok.com/ZSABCdef1/", "short"],
    ["https://vm.tiktok.com/ZMabc123/", "short"],
    ["https://www.tiktok.com/t/ZTabc123/", "short"],
  ])("%s → %s", (url, kind) => expect(parseTikTokInput(url)?.kind).toBe(kind));
  it.each(["https://evil.com/@u/video/7106594312292453675", "https://tiktok.com.evil.com/@u/video/1", "javascript:alert(1)", "https://www.tiktok.com/@user", "https://user:pw@www.tiktok.com/@u/video/7106594312292453675"])(
    "rejects %s",
    (u) => expect(parseTikTokInput(u)).toBeNull(),
  );
});

describe("normalizeUsername", () => {
  it("accepts with/without @", () => {
    expect(normalizeUsername("@Kreator.AM")).toBe("kreator.am");
    expect(normalizeUsername("user_1")).toBe("user_1");
  });
  it.each(["a", "bad name", "x".repeat(25), "ends.", "<script>", "@"])("rejects %s", (u) => expect(normalizeUsername(u)).toBeNull());
});

describe("API schemas", () => {
  it("search: keyword", () => {
    expect(searchSchema.parse({ mode: "keyword", query: "  preset   am  " })).toEqual({ mode: "keyword", query: "preset am", cursor: null });
    expect(searchSchema.safeParse({ mode: "keyword", query: "a" }).success).toBe(false);
    expect(searchSchema.safeParse({ mode: "keyword", query: "x".repeat(101) }).success).toBe(false);
  });
  it("search: creator normalises username", () => {
    expect(searchSchema.parse({ mode: "creator", query: "@Kreator" }).query).toBe("kreator");
    expect(searchSchema.safeParse({ mode: "creator", query: "bad name!" }).success).toBe(false);
  });
  it("search: rejects unknown modes and bad cursors", () => {
    expect(searchSchema.safeParse({ mode: "admin", query: "x" }).success).toBe(false);
    expect(searchSchema.safeParse({ mode: "keyword", query: "ok ok", cursor: "../../etc" }).success).toBe(false);
  });
  it("video & extract & download", () => {
    expect(videoSchema.safeParse({ input: "https://vt.tiktok.com/ZSABCdef1/" }).success).toBe(true);
    expect(videoSchema.safeParse({ input: "http://169.254.169.254/" }).success).toBe(false);
    expect(extractSchema.safeParse({ videoId: "7106594312292453675" }).success).toBe(true);
    expect(extractSchema.safeParse({ videoId: "1; DROP" }).success).toBe(false);
    expect(extractSchema.safeParse({ text: "x".repeat(5001) }).success).toBe(false);
    expect(downloadSchema.safeParse({ id: "7106594312292453675", type: "exe" }).success).toBe(false);
  });
});
