/**
 * Pure, isomorphic (client + server) preset link patterns.
 * No Node.js imports here — this module is also bundled for the browser.
 */
import type { LinkValidation, PresetPlatform } from "@/types";

export const SHORTLINK_HOSTS = ["bit.ly", "s.id", "tinyurl.com", "t.co"] as const;

/** Domains we recognise in free text even without an explicit http(s):// prefix. */
const BARE_DOMAINS = [
  "alightcreative\\.com",
  "alight\\.link",
  "drive\\.google\\.com",
  "mediafire\\.com",
  "mega\\.nz",
  "capcut\\.com",
  "vlognow\\.me",
  "bit\\.ly",
  "s\\.id",
  "tinyurl\\.com",
  "t\\.co",
];

const EXPLICIT_URL_RE = /\bhttps?:\/\/[^\s<>"'`{}|\\^\u3000]+/gi;
const BARE_URL_RE = new RegExp(
  `(?<![\\w.@/-])(?:www\\.)?(?:[a-z0-9-]+\\.)*(?:${BARE_DOMAINS.join("|")})\\/[^\\s<>"'\`{}|\\\\^\\u3000]*`,
  "gi",
);

const TRAILING_PUNCT = /[)\]}>.,!?;:'"»”’。、，！？：；》」』…]+$/u;
const MAX_TEXT_LENGTH = 20_000;

function trimTrailing(url: string): string {
  let out = url.replace(TRAILING_PUNCT, "");
  // keep balanced parentheses (e.g. wikipedia-style) — drop an unmatched trailing ")"
  while (out.endsWith(")") && (out.match(/\(/g)?.length ?? 0) < (out.match(/\)/g)?.length ?? 0)) {
    out = out.slice(0, -1);
  }
  return out;
}

/** Find URL-looking substrings in free text. Returns raw strings (prefixed with https:// when bare). */
export function findUrlCandidates(text: string): string[] {
  if (!text) return [];
  const input = text.slice(0, MAX_TEXT_LENGTH);
  const found: string[] = [];
  const seen = new Set<string>();
  const push = (u: string) => {
    const t = trimTrailing(u);
    if (t.length < 8 || seen.has(t.toLowerCase())) return;
    seen.add(t.toLowerCase());
    found.push(t);
  };
  for (const m of input.matchAll(EXPLICIT_URL_RE)) push(m[0]);
  // remove explicit URLs before scanning bare domains to avoid double matches
  const withoutExplicit = input.replace(EXPLICIT_URL_RE, " ");
  for (const m of withoutExplicit.matchAll(BARE_URL_RE)) push(`https://${m[0]}`);
  return found;
}

function host(url: URL): string {
  return url.hostname.toLowerCase().replace(/\.$/, "");
}

export function hostIs(url: URL, domain: string): boolean {
  const h = host(url);
  return h === domain || h.endsWith(`.${domain}`);
}

export function isShortlinkUrl(url: URL): boolean {
  return SHORTLINK_HOSTS.some((d) => host(url) === d || host(url) === `www.${d}`);
}

export interface Classification {
  platform: PresetPlatform;
  validation: Extract<LinkValidation, "verified" | "candidate">;
}

/** Classify a parsed URL into a preset category, or null when unrelated. */
export function classifyUrl(url: URL): Classification | null {
  const path = url.pathname;
  if (hostIs(url, "alightcreative.com")) {
    return /^\/am\/share\/.+/i.test(path) ? { platform: "alight_motion", validation: "verified" } : null;
  }
  if (hostIs(url, "alight.link")) {
    return path.length > 1 ? { platform: "alight_motion", validation: "verified" } : null;
  }
  if (hostIs(url, "capcut.com")) {
    if (/^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?(?:t|template-detail)\/.+/i.test(path)) {
      return { platform: "capcut", validation: "verified" };
    }
    return null;
  }
  if (hostIs(url, "vlognow.me")) {
    return path.length > 1 ? { platform: "vn", validation: "verified" } : null;
  }
  // Generic file hosts: a match is only a *candidate* (could be anything).
  if (hostIs(url, "drive.google.com")) {
    return /^\/(?:file\/d\/|drive\/folders\/|open|uc|drive\/u\/\d+\/folders\/)/i.test(path)
      ? { platform: "xml_pack", validation: "candidate" }
      : null;
  }
  if (hostIs(url, "mediafire.com")) {
    return /^\/(?:file|folder|download|view|\?)/i.test(path) || url.search.length > 1
      ? { platform: "xml_pack", validation: "candidate" }
      : null;
  }
  if (hostIs(url, "mega.nz")) {
    return /^\/(?:file|folder|#)/i.test(path) || url.hash.length > 1 ? { platform: "xml_pack", validation: "candidate" } : null;
  }
  return null;
}

const TRACKING_PARAMS = /^(?:utm_[a-z]+|fbclid|gclid|igshid|si|_r|_t|share_app_id|share_link_id|tt_from|u_code)$/i;

/** Canonical URL used for de-duplication & bookmark IDs. */
export function canonicalizeUrl(url: URL): string {
  const u = new URL(url.toString());
  u.hostname = host(u).replace(/^www\./, "");
  if (u.protocol === "http:") u.protocol = "https:";
  u.port = "";
  for (const key of [...u.searchParams.keys()]) {
    if (TRACKING_PARAMS.test(key)) u.searchParams.delete(key);
  }
  // mega.nz keeps its decryption key in the hash — every other host: drop fragments
  if (!hostIs(u, "mega.nz")) u.hash = "";
  let s = u.toString();
  if (s.endsWith("/") && u.pathname !== "/") s = s.slice(0, -1);
  return s;
}

export const PLATFORM_LABEL: Record<PresetPlatform, string> = {
  alight_motion: "Alight Motion",
  xml_pack: "XML / Pack",
  capcut: "CapCut",
  vn: "VN",
  other: "Lainnya",
};

export const VALIDATION_LABEL: Record<LinkValidation, string> = {
  verified: "Pola Preset Cocok",
  candidate: "Kandidat Link",
  resolved: "Shortlink Terurai",
  unchecked: "Belum Diperiksa",
  blocked: "Diblokir (Tidak Aman)",
};

/** Heuristic only: does a caption look preset-related? Used for the "Kandidat Relevan" badge. */
const RELEVANCE_RE =
  /\b(preset|xml|alight\s?motion|\bam\b|capcut|template|vn|jedag\s?jedug|jj|velocity|shake|cc|5\s?mb|link\s?(di|in)\s?bio|project\s?pack)\b/i;
export function looksPresetRelated(caption: string): boolean {
  return RELEVANCE_RE.test(caption);
}

/** Quick caption-only scan used for list badges (no network, no shortlink resolution). */
export function countCaptionPresetLinks(caption: string): number {
  let n = 0;
  for (const raw of findUrlCandidates(caption)) {
    try {
      if (classifyUrl(new URL(raw))) n++;
    } catch {
      /* ignore */
    }
  }
  return n;
}
