"use client";
import { CalendarDays, ExternalLink, Music2, Share2 } from "lucide-react";
import { useState } from "react";
import type { VideoItem } from "@/types";
import { Button } from "@/components/ui/button";
import { SafeImage } from "@/components/ui/safe-image";
import { useToast } from "@/components/ui/toast";
import { ExtractionPanel } from "@/components/preset/extraction-panel";
import { shareLink } from "@/lib/client/clipboard";
import { isAllowedMediaUrl } from "@/lib/utils/media-hosts";
import { formatDateTime, formatDuration } from "@/lib/utils/format";
import { MediaDownloads } from "./media-downloads";
import { StatsRow } from "./stats";

export function VideoDetail({ video }: { video: VideoItem }) {
  const toast = useToast();
  const [playerFailed, setPlayerFailed] = useState(false);
  const canPlay = Boolean(video.playUrl && isAllowedMediaUrl(video.playUrl) && !playerFailed);
  const created = formatDateTime(video.createdAt);
  const duration = formatDuration(video.duration);

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,280px)_1fr] lg:grid-cols-[minmax(0,320px)_1fr]">
      <div className="space-y-3">
        <div className="relative mx-auto aspect-[9/16] w-full max-w-[280px] overflow-hidden rounded-xl border border-line/10 bg-black md:max-w-none">
          {canPlay ? (
            <video
              src={video.playUrl ?? undefined}
              poster={video.cover && isAllowedMediaUrl(video.cover) ? video.cover : undefined}
              controls
              playsInline
              preload="none"
              onError={() => setPlayerFailed(true)}
              className="h-full w-full object-contain"
              aria-label={`Video oleh @${video.author.username}`}
            />
          ) : (
            <SafeImage src={video.cover} alt={`Thumbnail video @${video.author.username}`} className="h-full w-full" eager />
          )}
          {duration && <span className="pointer-events-none absolute right-2 top-2 rounded bg-black/60 px-1.5 text-xs tabular-nums">{duration}</span>}
        </div>
        {playerFailed && <p className="text-center text-xs text-ink-dim">Pemutar tidak dapat memuat media (tautan provider mungkin kedaluwarsa).</p>}
      </div>

      <div className="min-w-0 space-y-5">
        <div className="flex items-center gap-3">
          <SafeImage src={video.author.avatar} alt="" className="h-11 w-11 shrink-0 rounded-full border border-line/15" />
          <div className="min-w-0">
            <p className="truncate font-semibold">@{video.author.username}</p>
            {video.author.nickname && <p className="truncate text-sm text-ink-muted">{video.author.nickname}</p>}
          </div>
        </div>
        {/* Caption rendered as plain text (React escapes it) — never as HTML */}
        <p className="max-w-prose whitespace-pre-wrap break-words text-sm leading-relaxed text-ink">{video.caption || "(tanpa caption)"}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <StatsRow stats={video.stats} showShares />
          {created && (
            <span className="inline-flex items-center gap-1 text-sm text-ink-muted">
              <CalendarDays className="h-4 w-4" aria-hidden /> {created}
            </span>
          )}
        </div>
        {video.musicTitle && (
          <p className="inline-flex max-w-full items-center gap-1.5 text-xs text-ink-dim">
            <Music2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">{video.musicTitle}</span>
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-neon-cyan/40 px-3 text-sm text-neon-cyan transition hover:bg-neon-cyan/10"
          >
            <ExternalLink className="h-4 w-4" aria-hidden /> Buka di TikTok
          </a>
          <Button
            size="sm"
            icon={<Share2 className="h-4 w-4" aria-hidden />}
            onClick={async () => {
              const r = await shareLink(video.url, `Video @${video.author.username}`);
              if (r === "copied") toast("Link video disalin.", "success");
              else if (r === "failed") toast("Gagal membagikan link.", "error");
            }}
          >
            Bagikan
          </Button>
        </div>
        <MediaDownloads video={video} />
        <div className="h-px bg-line/10" />
        <ExtractionPanel video={video} />
      </div>
    </div>
  );
}
