import { isIP } from "node:net";
import { isPrivateIp } from "./ip";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata",
  "metadata.google.internal",
  "metadata.goog",
  "instance-data",
  "instance-data.ec2.internal",
  "kubernetes",
  "kubernetes.default",
]);

const BLOCKED_SUFFIXES = [".localhost", ".local", ".internal", ".lan", ".home.arpa", ".intranet", ".corp", ".railway.internal"];

export const MAX_URL_LENGTH = 2048;

/** Lower-cased hostname without IPv6 brackets or trailing dot. */
export function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
}

/** Hostname-level checks that don't require DNS. */
export function isBlockedHostname(hostname: string): boolean {
  const host = normalizeHostname(hostname);
  if (!host) return true;
  if (BLOCKED_HOSTNAMES.has(host)) return true;
  if (BLOCKED_SUFFIXES.some((s) => host.endsWith(s))) return true;
  if (isIP(host)) return isPrivateIp(host);
  // single-label names (e.g. "router", "redis") resolve to internal services
  if (!host.includes(".")) return true;
  return false;
}

/**
 * Strictly parse a user-supplied URL that may be opened by a browser or
 * requested by the server. Returns null when unsafe.
 * - http/https only
 * - no embedded credentials
 * - default ports only
 * - no internal / private hosts
 */
export function parsePublicHttpUrl(raw: string, opts: { allowHttp?: boolean } = {}): URL | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > MAX_URL_LENGTH) return null;
  // reject whitespace/control characters inside the URL
  if (/[\s\u0000-\u001f\u007f]/.test(trimmed)) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  const allowHttp = opts.allowHttp ?? true;
  if (url.protocol !== "https:" && !(allowHttp && url.protocol === "http:")) return null;
  if (url.username || url.password) return null;
  if (url.port && url.port !== "80" && url.port !== "443") return null;
  if (isBlockedHostname(url.hostname)) return null;
  return url;
}

/** True when `host` equals `domain` or is a subdomain of it. */
export function hostMatches(host: string, domain: string): boolean {
  const h = normalizeHostname(host);
  const d = domain.toLowerCase();
  return h === d || h.endsWith(`.${d}`);
}
