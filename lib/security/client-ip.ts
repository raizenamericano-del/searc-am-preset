import { isIP } from "node:net";

function cleanIp(value: string): string | null {
  const v = value.trim();
  if (isIP(v)) return v;
  const v4WithPort = v.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/);
  if (v4WithPort?.[1] && isIP(v4WithPort[1])) return v4WithPort[1];
  const bracketed = v.match(/^\[([0-9a-fA-F:.]+)\](?::\d+)?$/);
  if (bracketed?.[1] && isIP(bracketed[1])) return bracketed[1];
  return null;
}

/**
 * Determine the client identifier for rate limiting.
 * Forwarding headers are only trusted when TRUSTED_IP_HEADER is explicitly
 * configured (i.e. the platform edge overwrites/appends it, like Railway).
 * For X-Forwarded-For we take the right-most entry — the one appended by
 * the trusted proxy — never the client-controlled left-most value.
 */
export function getClientKey(headers: Headers, trustedHeader = process.env.TRUSTED_IP_HEADER): string {
  const name = trustedHeader?.trim().toLowerCase();
  if (!name) return "global";
  const raw = headers.get(name);
  if (!raw) return "global";
  const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
  const candidate = name === "x-forwarded-for" ? parts[parts.length - 1] : parts[0];
  return (candidate && cleanIp(candidate)) || "global";
}
