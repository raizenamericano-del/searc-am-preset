/** Pure helpers for TikTok URLs & usernames (isomorphic). */

const TIKTOK_HOSTS = new Set(["tiktok.com", "www.tiktok.com", "m.tiktok.com", "vt.tiktok.com", "vm.tiktok.com"]);
const SHORT_HOSTS = new Set(["vt.tiktok.com", "vm.tiktok.com"]);

export type TikTokInput =
  | { kind: "video"; id: string; url: string; username: string | null }
  | { kind: "short"; url: string };

const VIDEO_ID_RE = /^\d{8,25}$/;

export function isVideoId(value: string): boolean {
  return VIDEO_ID_RE.test(value);
}

/** Parse & normalise a TikTok video link or short link. Returns null if not a TikTok video URL. */
export function parseTikTokInput(raw: string): TikTokInput | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 2048) return null;
  if (isVideoId(trimmed)) return { kind: "video", id: trimmed, url: `https://www.tiktok.com/@_/video/${trimmed}`, username: null };
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.username || url.password || (url.port && url.port !== "443" && url.port !== "80")) return null;
  const host = url.hostname.toLowerCase();
  if (!TIKTOK_HOSTS.has(host)) return null;

  if (SHORT_HOSTS.has(host)) {
    const code = url.pathname.split("/").filter(Boolean)[0];
    if (!code || !/^[A-Za-z0-9_-]{4,20}$/.test(code)) return null;
    return { kind: "short", url: `https://${host}/${code}/` };
  }
  const shortT = url.pathname.match(/^\/t\/([A-Za-z0-9_-]{4,20})\/?$/);
  if (shortT?.[1]) return { kind: "short", url: `https://www.tiktok.com/t/${shortT[1]}/` };

  const full = url.pathname.match(/^\/@([A-Za-z0-9._]{1,30})\/(?:video|photo)\/(\d{8,25})/);
  if (full?.[1] && full[2]) {
    return { kind: "video", id: full[2], username: full[1], url: `https://www.tiktok.com/@${full[1]}/video/${full[2]}` };
  }
  const legacy = url.pathname.match(/^\/(?:v|embed(?:\/v2)?)\/(\d{8,25})/);
  if (legacy?.[1]) return { kind: "video", id: legacy[1], username: null, url: `https://www.tiktok.com/@_/video/${legacy[1]}` };
  const share = url.searchParams.get("share_item_id") ?? url.searchParams.get("item_id");
  if (share && isVideoId(share)) return { kind: "video", id: share, username: null, url: `https://www.tiktok.com/@_/video/${share}` };
  return null;
}

/** TikTok usernames: letters, digits, underscore, period; 2–24 chars; cannot end with a period. */
const USERNAME_RE = /^[A-Za-z0-9_](?:[A-Za-z0-9._]{0,22}[A-Za-z0-9_])?$/;

export function normalizeUsername(raw: string): string | null {
  const u = raw.trim().replace(/^@/, "");
  if (u.length < 2 || u.length > 24) return null;
  return USERNAME_RE.test(u) ? u.toLowerCase() : null;
}

export function tiktokVideoUrl(id: string, username?: string | null): string {
  return `https://www.tiktok.com/@${username && username !== "_" ? username : "_"}/video/${id}`;
}

export function isTikTokHost(hostname: string): boolean {
  return TIKTOK_HOSTS.has(hostname.toLowerCase());
}
