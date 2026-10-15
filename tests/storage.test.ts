import { describe, expect, it } from "vitest";
import { createLocalStore, readEnvelope, type StorageLike } from "@/lib/storage/local-store";
import { addHistory, HISTORY_LIMIT, removeHistory, validateHistory } from "@/lib/storage/history";
import { addBookmark, bookmarkId, filterBookmarks, removeBookmark, validateBookmarks } from "@/lib/storage/bookmarks";

function memStorage(init: Record<string, string> = {}): StorageLike {
  const m = new Map(Object.entries(init));
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
}

const opts = { key: "k", version: 1, fallback: [] as string[], validate: (d: unknown) => (Array.isArray(d) && d.every((x) => typeof x === "string") ? (d as string[]) : null) };

describe("local store", () => {
  it("falls back on corrupt JSON, wrong shape and unknown version", () => {
    expect(readEnvelope("{broken", opts)).toEqual([]);
    expect(readEnvelope(JSON.stringify([1, 2]), opts)).toEqual([]);
    expect(readEnvelope(JSON.stringify({ v: 99, data: ["a"] }), opts)).toEqual([]);
    expect(readEnvelope(JSON.stringify({ v: 1, data: [1] }), opts)).toEqual([]);
    expect(readEnvelope(JSON.stringify({ v: 1, data: ["a"] }), opts)).toEqual(["a"]);
  });
  it("migrates older versions when a migrator exists", () => {
    const r = readEnvelope(JSON.stringify({ v: 0, data: "a,b" }), { ...opts, migrate: (d) => (typeof d === "string" ? d.split(",") : null) });
    expect(r).toEqual(["a", "b"]);
  });
  it("persists, returns stable references and notifies subscribers", () => {
    const storage = memStorage({ k: "garbage" });
    const s = createLocalStore({ ...opts, storage: () => storage });
    expect(s.get()).toEqual([]);
    let n = 0;
    const un = s.subscribe(() => n++);
    s.set((p) => [...p, "x"]);
    expect(s.get()).toEqual(["x"]);
    expect(s.get()).toBe(s.get());
    expect(n).toBe(1);
    un();
  });
  it("survives storage that throws (private mode / quota)", () => {
    const bad: StorageLike = { getItem: () => { throw new Error("denied"); }, setItem: () => { throw new Error("quota"); }, removeItem: () => {} };
    const s = createLocalStore({ ...opts, storage: () => bad });
    expect(s.get()).toEqual([]);
    expect(() => s.set(["a"])).not.toThrow();
  });
});

describe("history", () => {
  it("keeps 8 most recent and de-duplicates identical searches", () => {
    let h = validateHistory([])!;
    for (let i = 0; i < 12; i++) h = addHistory(h, "keyword", `q${i}`, i);
    expect(h).toHaveLength(HISTORY_LIMIT);
    expect(h[0]?.query).toBe("q11");
    h = addHistory(h, "keyword", "Q11 ", 100);
    expect(h.filter((x) => x.query.toLowerCase().trim() === "q11")).toHaveLength(1);
    expect(addHistory(h, "keyword", "   ")).toBe(h);
    expect(removeHistory(h, h[0]!.id)).toHaveLength(HISTORY_LIMIT - 1);
  });
  it("drops invalid entries from storage", () => {
    expect(validateHistory([{ id: "a", mode: "keyword", query: "x", at: 1 }, { id: "b", mode: "evil", query: "x", at: 1 }, null])).toHaveLength(1);
    expect(validateHistory("nope")).toBeNull();
  });
});

describe("bookmarks", () => {
  it("prevents duplicates via canonical URL", () => {
    let b = addBookmark([], { url: "https://www.capcut.com/t/abc/?utm_source=x" }, 1);
    b = addBookmark(b, { url: "http://capcut.com/t/abc" }, 2);
    expect(b).toHaveLength(1);
    expect(b[0]).toMatchObject({ platform: "capcut", canonicalUrl: "https://capcut.com/t/abc" });
    expect(bookmarkId("https://www.capcut.com/t/abc")).toBe(bookmarkId("http://capcut.com/t/abc/"));
  });
  it("rejects non-http URLs", () => {
    expect(addBookmark([], { url: "javascript:alert(1)" })).toEqual([]);
  });
  it("removes, filters and validates", () => {
    let b = addBookmark([], { url: "https://alight.link/a", author: "kreator" }, 1);
    b = addBookmark(b, { url: "https://mega.nz/file/x#k" }, 2);
    expect(filterBookmarks(b, "", "alight_motion")).toHaveLength(1);
    expect(filterBookmarks(b, "KREATOR", "all")).toHaveLength(1);
    expect(removeBookmark(b, b[0]!.id)).toHaveLength(1);
    expect(validateBookmarks([...b, b[0], { id: "x", url: "javascript:1" }])).toHaveLength(2);
  });
});
