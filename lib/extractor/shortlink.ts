import "server-only";
import { shortlinkCache } from "@/lib/cache";
import { resolveRedirects, type HopFn } from "@/lib/security/safe-redirect";
import { SHORTLINK_HOSTS } from "./patterns";

const FOLLOWABLE = new Set<string>([...SHORTLINK_HOSTS, ...SHORTLINK_HOSTS.map((h) => `www.${h}`)]);

export type ShortlinkOutcome = { status: "resolved"; url: string } | { status: "unchecked" } | { status: "blocked" };

/** Resolve a known shortlink to its destination (cached on success). Never fetches the destination. */
export async function resolveShortlink(url: string, hop?: HopFn): Promise<ShortlinkOutcome> {
  const cached = shortlinkCache.get(url);
  if (cached) return { status: "resolved", url: cached };
  const result = await resolveRedirects(url, {
    isFollowable: (u) => FOLLOWABLE.has(u.hostname.toLowerCase()),
    maxRedirects: 4,
    timeoutMs: Number(process.env.SHORTLINK_TIMEOUT_MS) || 4000,
    hop,
  });
  if (result.ok) {
    shortlinkCache.set(url, result.finalUrl);
    return { status: "resolved", url: result.finalUrl };
  }
  if (result.reason === "unsafe_target") return { status: "blocked" };
  return { status: "unchecked" };
}
