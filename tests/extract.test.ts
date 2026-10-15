import { describe, expect, it, vi } from "vitest";
import { extractPresetLinks } from "@/lib/extractor/extract";

const now = () => new Date("2026-01-01T00:00:00Z");

describe("extractPresetLinks", () => {
  it("extracts from multiple sources with source + timestamp and de-duplicates by canonical URL", async () => {
    const links = await extractPresetLinks(
      [
        { text: "preset: https://alight.link/abc?utm_source=tt", source: "caption" },
        { text: "link sama: alight.link/abc", source: "comment", context: "Komentar kreator" },
        { text: "xml di drive.google.com/file/d/1XyZ/view", source: "bio" },
      ],
      { now },
    );
    expect(links).toHaveLength(2);
    expect(links[0]).toMatchObject({ platform: "alight_motion", source: "caption", validation: "verified", canonicalUrl: "https://alight.link/abc", analyzedAt: "2026-01-01T00:00:00.000Z" });
    expect(links[1]).toMatchObject({ platform: "xml_pack", source: "bio", validation: "candidate" });
  });

  it("ignores internal / private URLs and unrelated links", async () => {
    const links = await extractPresetLinks([{ text: "http://127.0.0.1/x http://169.254.169.254/latest https://example.com/hello", source: "caption" }], { now });
    expect(links).toEqual([]);
  });

  it("marks unresolved shortlinks as unchecked when no resolver is given", async () => {
    const [l] = await extractPresetLinks([{ text: "bit.ly/preset1", source: "caption" }], { now });
    expect(l).toMatchObject({ validation: "unchecked", platform: "other", viaShortlink: "bit.ly", originalUrl: "https://bit.ly/preset1" });
  });

  it("classifies resolved shortlinks by destination", async () => {
    const resolve = vi.fn().mockResolvedValue({ status: "resolved", url: "https://alightcreative.com/am/share/u/a/p/b" });
    const [l] = await extractPresetLinks([{ text: "s.id/am1", source: "comment" }], { now, resolveShortlink: resolve });
    expect(resolve).toHaveBeenCalledWith("https://s.id/am1");
    expect(l).toMatchObject({ platform: "alight_motion", validation: "verified", viaShortlink: "s.id", canonicalUrl: "https://alightcreative.com/am/share/u/a/p/b" });
  });

  it("flags shortlinks resolving to unsafe targets as blocked (no canonical URL)", async () => {
    const [l] = await extractPresetLinks([{ text: "tinyurl.com/evil" , source: "caption" }], { now, resolveShortlink: async () => ({ status: "blocked" }) });
    expect(l).toMatchObject({ validation: "blocked", canonicalUrl: null });
  });

  it("keeps the original URL as unchecked when the resolver throws", async () => {
    const [l] = await extractPresetLinks([{ text: "t.co/x1", source: "caption" }], { now, resolveShortlink: async () => { throw new Error("boom"); } });
    expect(l?.validation).toBe("unchecked");
  });

  it("limits the number of shortlink resolutions", async () => {
    const resolve = vi.fn().mockResolvedValue({ status: "unchecked" });
    const text = Array.from({ length: 12 }, (_, i) => `bit.ly/p${i}`).join(" ");
    await extractPresetLinks([{ text, source: "caption" }], { now, resolveShortlink: resolve, maxShortlinks: 3 });
    expect(resolve).toHaveBeenCalledTimes(3);
  });
});
