const compact = new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 });

/** null → "—" (data not available); never invents 0. */
export function formatCount(n: number | null | undefined): string {
  return typeof n === "number" ? compact.format(n) : "—";
}

export function formatDuration(sec: number | null | undefined): string | null {
  if (typeof sec !== "number" || sec <= 0) return null;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatBytes(n: number | null | undefined): string | null {
  if (typeof n !== "number" || n <= 0) return null;
  return n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`;
}

export function formatDateTime(input: string | number | null | undefined): string | null {
  if (input === null || input === undefined) return null;
  const d = typeof input === "number" ? new Date(input < 1e12 ? input * 1000 : input) : new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export function timeAgo(ms: number, now = Date.now()): string {
  const diff = Math.max(0, now - ms) / 1000;
  if (diff < 60) return "baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
}

export function displayUrl(raw: string, max = 60): string {
  const s = raw.replace(/^https?:\/\//, "").replace(/^www\./, "");
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
