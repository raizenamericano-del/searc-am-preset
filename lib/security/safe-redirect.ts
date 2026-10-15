import { lookup as dnsLookup, type LookupAddress } from "node:dns";
import http from "node:http";
import https from "node:https";
import { isPrivateIp } from "./ip";
import { parsePublicHttpUrl } from "./url";

export interface HopResult {
  status: number;
  location: string | null;
}

export type HopFn = (url: URL, method: "HEAD" | "GET", signal: AbortSignal) => Promise<HopResult>;

export interface ResolveOptions {
  /** URLs we are allowed to send requests to (e.g. shortlink services only). */
  isFollowable: (url: URL) => boolean;
  maxRedirects?: number;
  timeoutMs?: number;
  /** Injected for tests; defaults to a pinned-DNS node http(s) request. */
  hop?: HopFn;
}

export type ResolveResult =
  | { ok: true; finalUrl: string; hops: number; chain: string[] }
  | { ok: false; reason: "invalid_url" | "not_followable" | "unsafe_target" | "too_many_redirects" | "timeout" | "network" | "no_redirect"; chain: string[] };

const REDIRECT_CODES = new Set([301, 302, 303, 307, 308]);
const RETRY_WITH_GET = new Set([400, 403, 404, 405, 501]);
const USER_AGENT = "Mozilla/5.0 (compatible; AMPencariPreset/1.0; +link-resolver)";

/**
 * DNS lookup used by the outgoing socket itself. Every resolved address is
 * validated, so a DNS-rebinding attack cannot swap in a private IP between
 * "check" and "connect" — the socket only ever connects to validated IPs.
 */
export function pinnedSafeLookup(
  hostname: string,
  options: { all?: boolean; family?: number } | number | undefined,
  callback: (err: NodeJS.ErrnoException | null, address: string | LookupAddress[], family?: number) => void,
): void {
  const wantAll = typeof options === "object" && options !== null && options.all === true;
  dnsLookup(hostname, { all: true, verbatim: true }, (err, addresses) => {
    if (err) return callback(err, "", 0);
    const list = addresses as LookupAddress[];
    if (!list.length || list.some((a) => isPrivateIp(a.address))) {
      const blocked: NodeJS.ErrnoException = new Error("Blocked private address");
      blocked.code = "ESSRFBLOCKED";
      return callback(blocked, "", 0);
    }
    if (wantAll) return callback(null, list);
    const first = list[0]!;
    return callback(null, first.address, first.family);
  });
}

/** Default hop: request headers only, never read the body, never forward cookies. */
export const nodeHop: HopFn = (url, method, signal) =>
  new Promise<HopResult>((resolve, reject) => {
    const mod = url.protocol === "https:" ? https : http;
    const req = mod.request(
      url,
      {
        method,
        signal,
        lookup: pinnedSafeLookup as unknown as typeof dnsLookup,
        headers: { "user-agent": USER_AGENT, accept: "text/html,*/*;q=0.5" },
        agent: false,
      },
      (res) => {
        const location = typeof res.headers.location === "string" ? res.headers.location : null;
        const status = res.statusCode ?? 0;
        // We only need headers — discard any body immediately (response size bound = 0).
        res.destroy();
        resolve({ status, location });
      },
    );
    req.on("error", reject);
    req.end();
  });

/**
 * Follow redirects of a shortlink *only while the current host is a known
 * shortlink service*. Every hop and every Location target is validated. As
 * soon as the redirect points at a non-shortlink host we stop and return it
 * without requesting it (we only need to *know* the destination).
 */
export async function resolveRedirects(input: string, options: ResolveOptions): Promise<ResolveResult> {
  const maxRedirects = options.maxRedirects ?? 5;
  const timeoutMs = Math.min(Math.max(options.timeoutMs ?? 4000, 1000), 5000);
  const hop = options.hop ?? nodeHop;
  const chain: string[] = [];

  let current = parsePublicHttpUrl(input);
  if (!current) return { ok: false, reason: "invalid_url", chain };
  if (!options.isFollowable(current)) {
    return { ok: false, reason: "not_followable", chain };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    for (let i = 0; i <= maxRedirects; i++) {
      chain.push(current.toString());
      let res = await hop(current, "HEAD", controller.signal);
      if (!REDIRECT_CODES.has(res.status) && RETRY_WITH_GET.has(res.status)) {
        res = await hop(current, "GET", controller.signal);
      }
      if (!REDIRECT_CODES.has(res.status) || !res.location) {
        if (i === 0) return { ok: false, reason: "no_redirect", chain };
        return { ok: true, finalUrl: current.toString(), hops: i, chain };
      }
      let nextRaw: string;
      try {
        nextRaw = new URL(res.location, current).toString();
      } catch {
        return { ok: false, reason: "unsafe_target", chain };
      }
      const next = parsePublicHttpUrl(nextRaw);
      if (!next) return { ok: false, reason: "unsafe_target", chain };
      if (i === maxRedirects) return { ok: false, reason: "too_many_redirects", chain };
      if (!options.isFollowable(next)) {
        chain.push(next.toString());
        return { ok: true, finalUrl: next.toString(), hops: i + 1, chain };
      }
      current = next;
    }
    return { ok: false, reason: "too_many_redirects", chain };
  } catch (err) {
    if (controller.signal.aborted) return { ok: false, reason: "timeout", chain };
    const code = (err as NodeJS.ErrnoException | undefined)?.code;
    if (code === "ESSRFBLOCKED") return { ok: false, reason: "unsafe_target", chain };
    return { ok: false, reason: "network", chain };
  } finally {
    clearTimeout(timer);
  }
}
