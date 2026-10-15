import type { ReactNode } from "react";
import { cn } from "@/lib/utils/format";

type Tone = "cyan" | "violet" | "blue" | "success" | "warn" | "danger" | "neutral" | "am" | "xml" | "capcut" | "vn" | "other";

const TONES: Record<Tone, string> = {
  cyan: "bg-neon-cyan/10 text-neon-cyan border-neon-cyan/25",
  violet: "bg-neon-violet/10 text-[#c79bff] border-neon-violet/30",
  blue: "bg-neon-blue/10 text-[#8fb8ff] border-neon-blue/30",
  success: "bg-success/10 text-success border-success/25",
  warn: "bg-warn/10 text-warn border-warn/25",
  danger: "bg-danger/10 text-danger border-danger/25",
  neutral: "bg-white/5 text-ink-muted border-line/15",
  am: "bg-platform-am/10 text-platform-am border-platform-am/30",
  xml: "bg-platform-xml/10 text-platform-xml border-platform-xml/30",
  capcut: "bg-platform-capcut/10 text-platform-capcut border-platform-capcut/30",
  vn: "bg-platform-vn/10 text-platform-vn border-platform-vn/30",
  other: "bg-platform-other/10 text-platform-other border-platform-other/30",
};

export function Badge({ tone = "neutral", icon, children, className }: { tone?: Tone; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-5", TONES[tone], className)}>
      {icon}
      {children}
    </span>
  );
}

export type { Tone as BadgeTone };
