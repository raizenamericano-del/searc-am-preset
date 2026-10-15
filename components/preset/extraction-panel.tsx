"use client";
import { CheckCircle2, CircleSlash, Loader2, MessageSquareText, ScanSearch, ShieldOff, TriangleAlert, UserRound, Type } from "lucide-react";
import type { ExtractionReport, SourceStatus, VideoItem } from "@/types";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Skeleton } from "@/components/ui/skeleton";
import { useExtraction } from "@/hooks/use-extraction";
import { formatDateTime } from "@/lib/utils/format";
import { PresetCard } from "./preset-card";

const STATUS_TEXT: Record<SourceStatus, string> = {
  scanned: "Dipindai",
  empty: "Kosong",
  unavailable: "Tidak tersedia di provider",
  blocked: "Diblokir provider",
  error: "Gagal diambil",
};

function SourceChip({ icon, label, status, extra }: { icon: React.ReactNode; label: string; status: SourceStatus; extra?: string }) {
  const ok = status === "scanned" || status === "empty";
  return (
    <li className="flex items-center gap-2 rounded-lg border border-line/10 bg-bg-soft/60 px-3 py-2 text-xs">
      <span className="text-ink-dim">{icon}</span>
      <span className="font-medium text-ink">{label}</span>
      <span className={`ml-auto inline-flex items-center gap-1 ${ok ? "text-success" : status === "blocked" ? "text-warn" : "text-ink-dim"}`}>
        {ok ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> : status === "blocked" ? <ShieldOff className="h-3.5 w-3.5" aria-hidden /> : <CircleSlash className="h-3.5 w-3.5" aria-hidden />}
        {STATUS_TEXT[status]}
        {extra}
      </span>
    </li>
  );
}

function Report({ report, video }: { report: ExtractionReport; video: VideoItem }) {
  return (
    <div className="space-y-4">
      <ul className="grid gap-2 sm:grid-cols-3" aria-label="Sumber yang dipindai">
        <SourceChip icon={<Type className="h-3.5 w-3.5" />} label="Caption" status={report.sources.caption} />
        <SourceChip
          icon={<MessageSquareText className="h-3.5 w-3.5" />}
          label="Komentar"
          status={report.sources.comments}
          extra={report.sources.comments === "scanned" ? ` (${report.commentsScanned})` : undefined}
        />
        <SourceChip icon={<UserRound className="h-3.5 w-3.5" />} label="Bio" status={report.sources.bio} />
      </ul>
      {report.links.length === 0 ? (
        <EmptyState
          icon={<ScanSearch className="h-6 w-6" aria-hidden />}
          title="Belum ada tautan preset terdeteksi"
          description="Tidak ditemukan link Alight Motion, XML/Pack, CapCut, VN, atau shortlink pada sumber yang tersedia. Kreator mungkin membagikan preset lewat bio, DM, atau komentar yang tidak dikembalikan provider."
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {report.links.map((l, i) => (
            <PresetCard key={l.id} link={l} video={video} index={i} />
          ))}
        </div>
      )}
      <p className="text-xs text-ink-dim">
        Dianalisis {formatDateTime(report.analyzedAt)}. “Kandidat Link” berarti link file umum (Drive/MediaFire/Mega) yang belum tentu berisi preset — periksa sebelum mengunduh.
      </p>
    </div>
  );
}

export function ExtractionPanel({ video }: { video: VideoItem }) {
  const { state, retry } = useExtraction(video.id);
  return (
    <section aria-labelledby="preset-heading" aria-busy={state.status === "loading"}>
      <div className="mb-3 flex items-center gap-2">
        <h3 id="preset-heading" className="font-display text-base font-semibold">
          Tautan Preset
        </h3>
        {state.status === "success" && (
          <span className="rounded-full bg-neon-cyan/10 px-2 py-0.5 text-xs font-semibold text-neon-cyan">{state.report.links.length}</span>
        )}
      </div>
      {state.status === "loading" && (
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm text-ink-muted">
            <Loader2 className="h-4 w-4 animate-spin text-neon-cyan" aria-hidden />
            Mendeteksi tautan preset dari caption, komentar & bio…
          </p>
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      )}
      {state.status === "error" && (
        <ErrorState title="Pemindaian preset gagal" message={state.error.message} hint={state.error.hint} onRetry={retry} />
      )}
      {state.status === "success" && <Report report={state.report} video={video} />}
      {state.status === "success" && state.report.sources.comments === "blocked" && (
        <p className="mt-3 flex items-start gap-2 text-xs text-warn">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden /> Komentar tidak dapat diambil dari provider saat ini.
        </p>
      )}
    </section>
  );
}
