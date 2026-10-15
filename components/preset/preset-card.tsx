"use client";
import { motion } from "framer-motion";
import { Bookmark, BookmarkCheck, Copy, ExternalLink, HelpCircle, QrCode, ShieldAlert } from "lucide-react";
import type { PresetLink, VideoItem } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useAppUi } from "@/components/providers/app-ui";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { usePresetActions } from "@/hooks/use-preset-actions";
import { PLATFORM_LABEL, VALIDATION_LABEL } from "@/lib/extractor/patterns";
import { displayUrl } from "@/lib/utils/format";
import { PLATFORM_TONE, SOURCE_LABEL, VALIDATION_TONE } from "./platform";

export function PresetCard({ link, video, index = 0 }: { link: PresetLink; video?: VideoItem; index?: number }) {
  const { open, copy, help } = usePresetActions();
  const { openQr } = useAppUi();
  const { isSaved, toggle } = useBookmarks();
  const toast = useToast();
  const target = link.canonicalUrl ?? link.originalUrl;
  const blocked = link.validation === "blocked";
  const saved = isSaved(target);

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.25 }}
      className="card border-gradient p-4"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone={PLATFORM_TONE[link.platform]}>{PLATFORM_LABEL[link.platform]}</Badge>
        <Badge tone={VALIDATION_TONE[link.validation]}>{VALIDATION_LABEL[link.validation]}</Badge>
        <Badge tone="neutral">{SOURCE_LABEL[link.source]}</Badge>
        {link.viaShortlink && <Badge tone="neutral">via {link.viaShortlink}</Badge>}
      </div>
      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-ink-dim">{link.domain}</p>
      <p className="mt-0.5 break-all font-mono text-[13px] leading-relaxed text-ink" title={target}>
        {displayUrl(target, 90)}
      </p>
      {link.viaShortlink && link.canonicalUrl && link.originalUrl !== link.canonicalUrl && (
        <p className="mt-1 break-all text-xs text-ink-dim">Asli: {displayUrl(link.originalUrl, 60)}</p>
      )}
      {link.context && <p className="mt-1 text-xs text-ink-muted">{link.context}</p>}

      {blocked ? (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-danger/10 p-2.5 text-xs text-danger">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          Shortlink ini mengarah ke alamat yang tidak aman (jaringan internal/privat) sehingga tidak dapat dibuka.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Button variant="primary" size="sm" className="col-span-2 sm:col-span-1" onClick={() => open(target, link.platform)} icon={<ExternalLink className="h-4 w-4" aria-hidden />}>
            Buka Preset
          </Button>
          <Button size="sm" onClick={() => void copy(target)} icon={<Copy className="h-4 w-4" aria-hidden />}>
            Salin Link
          </Button>
          <Button
            size="sm"
            aria-pressed={saved}
            onClick={() => {
              const now = toggle({
                url: target,
                platform: link.platform,
                validation: link.validation,
                videoId: video?.id,
                videoCaption: video?.caption,
                author: video?.author.username,
              });
              toast(now ? "Disimpan ke Tersimpan." : "Dihapus dari Tersimpan.", now ? "success" : "info");
            }}
            icon={saved ? <BookmarkCheck className="h-4 w-4 text-neon-cyan" aria-hidden /> : <Bookmark className="h-4 w-4" aria-hidden />}
          >
            {saved ? "Tersimpan" : "Simpan"}
          </Button>
          <Button size="sm" onClick={() => openQr(target)} icon={<QrCode className="h-4 w-4" aria-hidden />}>
            Buat QR
          </Button>
          <Button size="sm" variant="ghost" onClick={() => help(target, link.platform)} icon={<HelpCircle className="h-4 w-4" aria-hidden />}>
            Panduan
          </Button>
        </div>
      )}
    </motion.article>
  );
}
