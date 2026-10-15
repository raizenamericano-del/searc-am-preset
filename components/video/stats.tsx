import { Eye, Heart, MessageCircle, Share2 } from "lucide-react";
import type { VideoStats } from "@/types";
import { formatCount } from "@/lib/utils/format";

/** Shows only stats the provider returned; missing values render as "—" with an explanatory title. */
export function StatsRow({ stats, compact, showShares }: { stats: VideoStats; compact?: boolean; showShares?: boolean }) {
  const items = [
    { icon: Eye, label: "Tayangan", value: stats.views },
    { icon: Heart, label: "Suka", value: stats.likes },
    { icon: MessageCircle, label: "Komentar", value: stats.comments },
    ...(showShares ? [{ icon: Share2, label: "Dibagikan", value: stats.shares }] : []),
  ];
  return (
    <ul className={`flex flex-wrap items-center ${compact ? "gap-x-3 gap-y-1 text-[11px]" : "gap-x-4 gap-y-1 text-sm"} text-ink-muted`}>
      {items.map(({ icon: Icon, label, value }) => (
        <li key={label} className="inline-flex items-center gap-1" title={value === null ? `${label}: data tidak tersedia dari provider` : label}>
          <Icon className={compact ? "h-3 w-3" : "h-4 w-4"} aria-hidden />
          <span className="sr-only">{label}:</span>
          <span className="tabular-nums">{formatCount(value)}</span>
        </li>
      ))}
    </ul>
  );
}
