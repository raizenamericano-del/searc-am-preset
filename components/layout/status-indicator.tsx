"use client";
import { useHealth } from "@/hooks/use-health";
import { cn } from "@/lib/utils/format";

/** Shows real /api/health status — never a fake "users online" counter. */
export function StatusIndicator() {
  const { state, recheck } = useHealth();
  const meta =
    state.phase === "connecting"
      ? { label: "Connecting", dot: "bg-warn", text: "text-warn", title: "Memeriksa status layanan…" }
      : state.phase === "ready"
        ? { label: "API Ready", dot: "bg-success", text: "text-success", title: `Provider ${state.data.provider.name} terjangkau` }
        : state.phase === "degraded"
          ? { label: "Degraded", dot: "bg-warn", text: "text-warn", title: "Provider tidak terjangkau sepenuhnya" }
          : { label: "Service Unavailable", dot: "bg-danger", text: "text-danger", title: "Server tidak dapat dihubungi" };
  return (
    <button
      type="button"
      onClick={() => void recheck()}
      title={`${meta.title} — klik untuk cek ulang`}
      aria-label={`Status layanan: ${meta.label}. Klik untuk memeriksa ulang.`}
      className={cn("inline-flex h-8 items-center gap-1.5 rounded-full border border-line/15 bg-bg-soft/70 px-2.5 text-[11px] font-medium", meta.text)}
    >
      <span className="relative flex h-2 w-2">
        <span className={cn("absolute inline-flex h-full w-full animate-pulse-dot rounded-full opacity-60", meta.dot)} />
        <span className={cn("relative inline-flex h-2 w-2 rounded-full", meta.dot)} />
      </span>
      <span className="max-w-[5.5rem] truncate whitespace-nowrap sm:max-w-none">{meta.label}</span>
    </button>
  );
}
