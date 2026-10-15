import { describe, expect, it } from "vitest";
import { canonicalizeUrl, classifyUrl, countCaptionPresetLinks, findUrlCandidates, isShortlinkUrl } from "@/lib/extractor/patterns";

const cls = (u: string) => classifyUrl(new URL(u));

describe("findUrlCandidates", () => {
  it("finds explicit and bare URLs and trims punctuation", () => {
    const text = "Preset AM 👉 https://alightcreative.com/am/share/u/abc/p/xyz-123, XML: drive.google.com/file/d/1AbC/view). s.id/presetku!";
    expect(findUrlCandidates(text)).toEqual([
      "https://alightcreative.com/am/share/u/abc/p/xyz-123",
      "https://drive.google.com/file/d/1AbC/view",
      "https://s.id/presetku",
    ]);
  });
  it("does not match emails or random dotted words", () => {
    expect(findUrlCandidates("hubungi me@s.id/abc atau hello.world tanpa link")).toEqual([]);
  });
  it("de-duplicates identical URLs", () => {
    expect(findUrlCandidates("alight.link/x alight.link/x")).toHaveLength(1);
  });
});

describe("classifyUrl", () => {
  it.each([
    ["https://alightcreative.com/am/share/u/abc/p/def", "alight_motion", "verified"],
    ["https://alight.link/9xYz", "alight_motion", "verified"],
    ["https://www.capcut.com/t/Zs8abc/", "capcut", "verified"],
    ["https://www.capcut.com/template-detail/7300000000000", "capcut", "verified"],
    ["https://www.capcut.com/id-id/template-detail/abc", "capcut", "verified"],
    ["https://vlognow.me/s/abc", "vn", "verified"],
    ["https://drive.google.com/file/d/1abc/view?usp=sharing", "xml_pack", "candidate"],
    ["https://drive.google.com/drive/folders/1xyz", "xml_pack", "candidate"],
    ["https://www.mediafire.com/file/abc123/preset.xml/file", "xml_pack", "candidate"],
    ["https://mega.nz/file/AbC#keyXYZ", "xml_pack", "candidate"],
  ])("%s → %s/%s", (url, platform, validation) => {
    expect(cls(url)).toEqual({ platform, validation });
  });
  it.each(["https://alightcreative.com/", "https://www.capcut.com/", "https://drive.google.com/", "https://example.com/preset", "https://alight.link/"])(
    "returns null for non-preset URL %s",
    (url) => expect(cls(url)).toBeNull(),
  );
  it("rejects lookalike hosts", () => {
    expect(cls("https://alight.link.evil.com/x")).toBeNull();
    expect(cls("https://notcapcut.com/t/abc")).toBeNull();
  });
});

describe("shortlinks & canonicalisation", () => {
  it("recognises supported shortlink hosts only", () => {
    for (const u of ["https://bit.ly/a", "https://s.id/a", "https://tinyurl.com/a", "https://t.co/a"]) expect(isShortlinkUrl(new URL(u))).toBe(true);
    expect(isShortlinkUrl(new URL("https://bit.ly.evil.com/a"))).toBe(false);
  });
  it("canonicalises host, protocol, tracking params and fragments", () => {
    expect(canonicalizeUrl(new URL("http://WWW.CapCut.com/t/abc/?utm_source=x&_r=1#top"))).toBe("https://capcut.com/t/abc");
    expect(canonicalizeUrl(new URL("https://mega.nz/file/AbC#key"))).toBe("https://mega.nz/file/AbC#key");
  });
  it("counts caption preset links", () => {
    expect(countCaptionPresetLinks("am: alight.link/abc | cc: capcut.com/t/xyz | ig: instagram.com/x")).toBe(2);
  });
});
