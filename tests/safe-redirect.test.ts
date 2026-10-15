import { describe, expect, it, vi } from "vitest";
import { resolveRedirects, type HopFn } from "@/lib/security/safe-redirect";

const SHORT = new Set(["bit.ly", "s.id", "tinyurl.com"]);
const isFollowable = (u: URL) => SHORT.has(u.hostname);

function hopFrom(map: Record<string, { status: number; location?: string } | ((method: string) => { status: number; location?: string })>): HopFn & ReturnType<typeof vi.fn> {
  return vi.fn(async (url: URL, method: "HEAD" | "GET") => {
    const entry = map[url.toString()];
    if (!entry) return { status: 404, location: null };
    const r = typeof entry === "function" ? entry(method) : entry;
    return { status: r.status, location: r.location ?? null };
  }) as never;
}

describe("resolveRedirects", () => {
  it("follows a safe chain and stops at the first non-shortlink host without requesting it", async () => {
    const hop = hopFrom({
      "https://bit.ly/a": { status: 301, location: "https://s.id/b" },
      "https://s.id/b": { status: 302, location: "https://drive.google.com/file/d/1/view" },
    });
    const r = await resolveRedirects("https://bit.ly/a", { isFollowable, hop });
    expect(r).toMatchObject({ ok: true, finalUrl: "https://drive.google.com/file/d/1/view", hops: 2 });
    expect(hop).toHaveBeenCalledTimes(2); // drive.google.com never requested
  });

  it("supports relative Location headers", async () => {
    const hop = hopFrom({ "https://bit.ly/a": { status: 301, location: "/b" }, "https://bit.ly/b": { status: 302, location: "https://alight.link/x" } });
    const r = await resolveRedirects("https://bit.ly/a", { isFollowable, hop });
    expect(r).toMatchObject({ ok: true, finalUrl: "https://alight.link/x" });
  });

  it.each(["http://127.0.0.1/admin", "http://169.254.169.254/latest/meta-data/", "http://localhost:8080/", "http://[::1]/", "http://10.0.0.5/", "file:///etc/passwd", "javascript:alert(1)", "http://metadata.google.internal/"])(
    "rejects redirect to %s (SSRF)",
    async (target) => {
      const hop = hopFrom({ "https://bit.ly/a": { status: 302, location: target } });
      const r = await resolveRedirects("https://bit.ly/a", { isFollowable, hop });
      expect(r).toMatchObject({ ok: false, reason: "unsafe_target" });
    },
  );

  it("validates every hop, not only the first", async () => {
    const hop = hopFrom({
      "https://bit.ly/a": { status: 301, location: "https://s.id/b" },
      "https://s.id/b": { status: 301, location: "http://192.168.0.1/" },
    });
    expect(await resolveRedirects("https://bit.ly/a", { isFollowable, hop })).toMatchObject({ ok: false, reason: "unsafe_target" });
  });

  it("enforces the redirect limit", async () => {
    const hop = hopFrom({ "https://bit.ly/a": { status: 301, location: "https://bit.ly/b" }, "https://bit.ly/b": { status: 301, location: "https://bit.ly/a" } });
    expect(await resolveRedirects("https://bit.ly/a", { isFollowable, hop, maxRedirects: 3 })).toMatchObject({ ok: false, reason: "too_many_redirects" });
  });

  it("refuses to request hosts outside the allow-list", async () => {
    const hop = hopFrom({});
    expect(await resolveRedirects("https://evil.example/a", { isFollowable, hop })).toMatchObject({ ok: false, reason: "not_followable" });
    expect(hop).not.toHaveBeenCalled();
  });

  it("rejects private inputs before any request", async () => {
    const hop = hopFrom({});
    expect(await resolveRedirects("http://127.0.0.1/", { isFollowable: () => true, hop })).toMatchObject({ ok: false, reason: "invalid_url" });
    expect(hop).not.toHaveBeenCalled();
  });

  it("falls back from HEAD to GET when HEAD is not allowed", async () => {
    const hop = hopFrom({ "https://bit.ly/a": (m) => (m === "HEAD" ? { status: 405 } : { status: 301, location: "https://alight.link/z" }) });
    expect(await resolveRedirects("https://bit.ly/a", { isFollowable, hop })).toMatchObject({ ok: true, finalUrl: "https://alight.link/z" });
    expect(hop).toHaveBeenCalledTimes(2);
  });

  it("times out", async () => {
    const hop: HopFn = (_u, _m, signal) => new Promise((_, rej) => signal.addEventListener("abort", () => rej(new Error("aborted"))));
    const r = await resolveRedirects("https://bit.ly/slow", { isFollowable, hop, timeoutMs: 1000 });
    expect(r).toMatchObject({ ok: false, reason: "timeout" });
  });

  it("maps DNS-level SSRF blocks to unsafe_target", async () => {
    const hop: HopFn = async () => {
      const e: NodeJS.ErrnoException = new Error("blocked");
      e.code = "ESSRFBLOCKED";
      throw e;
    };
    expect(await resolveRedirects("https://bit.ly/a", { isFollowable, hop })).toMatchObject({ ok: false, reason: "unsafe_target" });
  });

  it("reports no_redirect when the shortlink does not redirect", async () => {
    const hop = hopFrom({ "https://bit.ly/a": { status: 200 } });
    expect(await resolveRedirects("https://bit.ly/a", { isFollowable, hop })).toMatchObject({ ok: false, reason: "no_redirect" });
  });
});
