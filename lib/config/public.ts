/**
 * Public, non-secret configuration (safe to expose to the browser).
 * Community / donation links come from NEXT_PUBLIC_* env vars. Empty → the UI
 * shows a clear "belum dikonfigurasi" placeholder instead of a fake link.
 */
function httpsOrNull(v: string | undefined, allowedHosts: string[]): string | null {
  if (!v) return null;
  try {
    const u = new URL(v);
    if (u.protocol !== "https:") return null;
    const h = u.hostname.toLowerCase();
    return allowedHosts.some((d) => h === d || h.endsWith(`.${d}`)) ? u.toString() : null;
  } catch {
    return null;
  }
}

export const COMMUNITY_LINKS = {
  whatsapp: httpsOrNull(process.env.NEXT_PUBLIC_WHATSAPP_URL, ["chat.whatsapp.com", "whatsapp.com", "wa.me"]),
  telegram: httpsOrNull(process.env.NEXT_PUBLIC_TELEGRAM_URL, ["t.me", "telegram.me"]),
  saweria: httpsOrNull(process.env.NEXT_PUBLIC_SAWERIA_URL, ["saweria.co"]),
  trakteer: httpsOrNull(process.env.NEXT_PUBLIC_TRAKTEER_URL, ["trakteer.id"]),
} as const;
