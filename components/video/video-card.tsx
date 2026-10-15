"use client";
import { motion } from "framer-motion";
import { ChevronRight, Clock, Sparkles, Target } from "lucide-react";
import { memo } from "react";
import type { VideoItem } from "@/types";
import { Badge } from "@/components/ui/badge";
import { SafeImage } from "@/components/ui/safe-image";
import { looksPresetRelated } from "@/lib/extractor/patterns";
import { formatDuration } from "@/lib/utils/format";
import { StatsRow } from "./stats";

function Badges({ video }: { video: VideoItem }) {
  const relevant = looksPresetRelated(video.caption);
  return (
    <>
      {video.captionPresetCount > 0 && (
        <Badge tone="success" icon={<Sparkles className="h-3 w-3" aria-hidden />}>
          Preset Terdeteksi
        </Badge>
      )}
      {relevant && (
        <Badge tone="violet" icon={<Target className="h-3 w-3" aria-hidden />}>
          Kandidat Relevan
        </Badge>
      )}
    </>
  );
}

export const VideoCard = memo(function VideoCard({ video, view, onOpen, index }: { video: VideoItem; view: "grid" | "list"; onOpen: (v: VideoItem) => void; index: number }) {
  const duration = formatDuration(video.duration);
  const caption = video.caption || "(tanpa caption)";
  const label = `Detail video @${video.author.username}: ${caption.slice(0, 80)}`;

  if (view === "list") {
    return (
      <motion.li initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.03, 0.3) }}>
        <button type="button" onClick={() => onOpen(video)} aria-label={label} className="card group flex w-full gap-3 p-3 text-left transition hover:border-neon-cyan/30">
          <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-lg sm:h-36 sm:w-28">
            <SafeImage src={video.cover} alt="" className="h-full w-full" />
            {duration && <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-[10px] tabular-nums">{duration}</span>}
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="text-xs font-semibold text-neon-cyan">@{video.author.username}</p>
            <p className="mt-1 line-clamp-3 text-sm text-ink">{caption}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              <Badges video={video} />
            </div>
            <div className="mt-auto flex items-center justify-between pt-2">
              <StatsRow stats={video.stats} compact />
              <span className="inline-flex items-center text-xs font-medium text-ink-muted group-hover:text-neon-cyan">
                Detail <ChevronRight className="h-4 w-4" aria-hidden />
              </span>
            </div>
          </div>
        </button>
      </motion.li>
    );
  }

  return (
    <motion.li initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.03, 0.3) }}>
      <button type="button" onClick={() => onOpen(video)} aria-label={label} className="card group flex h-full w-full flex-col overflow-hidden text-left transition hover:-translate-y-0.5 hover:border-neon-cyan/30 hover:shadow-glow-cyan">
        <div className="relative aspect-[3/4] w-full overflow-hidden">
          <SafeImage src={video.cover} alt="" className="h-full w-full transition duration-slow group-hover:scale-[1.03]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
          <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
            <Badges video={video} />
          </div>
          {duration && (
            <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] tabular-nums backdrop-blur">
              <Clock className="h-3 w-3" aria-hidden />
              {duration}
            </span>
          )}
          <div className="absolute inset-x-2 bottom-2">
            <StatsRow stats={video.stats} compact />
          </div>
        </div>
        <div className="flex flex-1 flex-col p-2.5 sm:p-3">
          <p className="truncate text-xs font-semibold text-neon-cyan">@{video.author.username}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-ink-muted sm:text-[13px]">{caption}</p>
          <span className="mt-auto inline-flex items-center pt-2 text-xs font-medium text-ink-muted group-hover:text-neon-cyan">
            Detail <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </span>
        </div>
      </button>
    </motion.li>
  );
});
