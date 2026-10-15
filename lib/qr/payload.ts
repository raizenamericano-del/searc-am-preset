import { validateOpenableUrl, type OpenableUrl } from "@/lib/client/open-link";

export type QrPayload = { kind: "url"; value: string; link: OpenableUrl } | { kind: "unsafe_url"; value: string } | { kind: "text"; value: string };

/** Classify decoded QR text. Non-http(s) schemes (javascript:, intent:, file: …) are never opened. */
export function classifyQrPayload(text: string): QrPayload {
  const value = text.trim().slice(0, 4096);
  const looksUrl = /^[a-z][a-z0-9+.-]*:/i.test(value) || /^[\w-]+(\.[\w-]+)+\//.test(value);
  if (!looksUrl) return { kind: "text", value };
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;
  const link = validateOpenableUrl(candidate);
  if (!link) return { kind: "unsafe_url", value };
  return { kind: "url", value: link.url.toString(), link };
}
