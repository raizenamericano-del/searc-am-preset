/** Hosts allowed for provider media (thumbnails, avatars, video, audio). Isomorphic. */
export const MEDIA_HOST_SUFFIXES = ["tiktokcdn.com", "tiktokcdn-us.com", "tiktokcdn-eu.com", "ibyteimg.com", "tikwm.com"] as const;

export function isAllowedMediaUrl(raw: string | null | undefined): boolean {
  if (!raw) return false;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return false;
    const h = u.hostname.toLowerCase();
    return MEDIA_HOST_SUFFIXES.some((s) => h === s || h.endsWith(`.${s}`));
  } catch {
    return false;
  }
}
