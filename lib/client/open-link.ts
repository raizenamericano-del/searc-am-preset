import type { PresetPlatform } from "@/types";
import { classifyUrl, hostIs, isShortlinkUrl } from "@/lib/extractor/patterns";

export type InAppBrowser = "tiktok" | "instagram" | "facebook" | "line" | "twitter" | null;

export function detectInAppBrowser(ua: string): InAppBrowser {
  if (/musical_ly|BytedanceWebview|TikTok|trill/i.test(ua)) return "tiktok";
  if (/Instagram/i.test(ua)) return "instagram";
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return "facebook";
  if (/\bLine\//i.test(ua)) return "line";
  if (/Twitter/i.test(ua)) return "twitter";
  return null;
}

export function detectOs(ua: string): "android" | "ios" | "other" {
  if (/Android/i.test(ua)) return "android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  return "other";
}

const PRIVATE_HOST = /^(localhost|.*\.(local|localhost|internal|lan|home\.arpa))$/i;
const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;

export interface OpenableUrl {
  url: URL;
  known: boolean;
  platform: PresetPlatform | null;
}

const KNOWN_DOMAINS = ["alightcreative.com", "alight.link", "capcut.com", "vlognow.me", "drive.google.com", "mediafire.com", "mega.nz", "tiktok.com"];

/**
 * Re-validate a URL right before opening it in the browser.
 * Only http(s); no credentials; no IP literals / internal hostnames.
 */
export function validateOpenableUrl(raw: string): OpenableUrl | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.username || url.password) return null;
  const host = url.hostname.toLowerCase();
  if (!host.includes(".") || PRIVATE_HOST.test(host) || IPV4.test(host) || host.startsWith("[")) return null;
  const cls = classifyUrl(url);
  const known = Boolean(cls) || isShortlinkUrl(url) || KNOWN_DOMAINS.some((d) => hostIs(url, d));
  return { url, known, platform: cls?.platform ?? null };
}

/** Android Chrome intent for escaping in-app browsers. Built only from a validated https URL. */
export function buildChromeIntent(url: URL): string | null {
  if (url.protocol !== "https:") return null;
  const target = `${url.host}${url.pathname}${url.search}${url.hash}`;
  return `intent://${target}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(url.toString())};end`;
}

export function openInNewTab(url: URL): boolean {
  const w = window.open(url.toString(), "_blank", "noopener,noreferrer");
  return w !== null || true; // with noopener most browsers return null even on success
}

export const PLATFORM_HELP: Record<PresetPlatform, string> = {
  alight_motion: "Pastikan aplikasi Alight Motion terpasang. Jika halaman web terbuka, ketuk tombol untuk membuka di Alight Motion, atau salin link lalu buka dari dalam aplikasi.",
  xml_pack: "Link ini menuju layanan penyimpanan file (Drive/MediaFire/Mega). Periksa isi file sebelum mengunduh; impor XML/project pack secara manual di aplikasi editor.",
  capcut: "Pastikan CapCut terpasang. Jika halaman template terbuka di browser, ketuk 'Gunakan template di CapCut'.",
  vn: "Pastikan VN Video Editor terpasang. Jika browser tidak mengalihkan otomatis, buka VN lalu tempel link dari clipboard.",
  other: "Domain ini tidak termasuk daftar host preset yang dikenal. Periksa tujuan link sebelum membuka.",
};
