import { Check, Loader2 } from "lucide-react";
import type { SearchMode } from "@/types";
import type { SearchStage } from "@/hooks/use-search";

const STEPS: Record<SearchMode, Array<{ id: SearchStage | "validated"; label: string }>> = {
  link: [
    { id: "validated", label: "Memvalidasi tautan" },
    { id: "metadata", label: "Menghubungi provider & mengambil metadata video" },
  ],
  keyword: [
    { id: "validated", label: "Memvalidasi kata kunci" },
    { id: "contacting", label: "Menghubungi provider & menyusun hasil pencarian" },
  ],
  creator: [
    { id: "validated", label: "Memvalidasi username" },
    { id: "contacting", label: "Menghubungi provider & mengambil daftar video kreator" },
  ],
};

/** Step list reflecting the app's real phases — no fake percentage. */
export function LoadingStages({ mode, stage }: { mode: SearchMode; stage: SearchStage }) {
  const steps = STEPS[mode];
  const currentIdx = steps.findIndex((s) => s.id === stage);
  return (
    <ol className="space-y-2" aria-live="polite">
      {steps.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <li key={s.id} className={`flex items-center gap-2.5 text-sm ${active ? "text-ink" : done ? "text-ink-muted" : "text-ink-dim"}`}>
            <span className={`flex h-5 w-5 items-center justify-center rounded-full ${done ? "bg-success/15 text-success" : active ? "bg-neon-cyan/15 text-neon-cyan" : "bg-white/5"}`}>
              {done ? <Check className="h-3 w-3" aria-hidden /> : active ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> : null}
            </span>
            {s.label}
          </li>
        );
      })}
      {mode === "link" && <li className="pl-7 text-xs text-ink-dim">Setelah metadata tampil, pemindaian tautan preset berjalan otomatis.</li>}
    </ol>
  );
}
