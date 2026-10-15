"use client";
import { ArrowDownWideNarrow, LayoutGrid, List, Loader2, SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import type { VideoItem } from "@/types";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { VideoCard } from "@/components/video/video-card";
import { useAppUi } from "@/components/providers/app-ui";
import type { ApiClientError } from "@/lib/client/api";
import { cn } from "@/lib/utils/format";

type Sort = "relevance" | "views" | "likes" | "newest";
const SORT_LABEL: Record<Sort, string> = { relevance: "Relevansi", views: "Tayangan", likes: "Suka", newest: "Terbaru" };

export function ResultsView({
  items,
  hasMore,
  loadingMore,
  moreError,
  onLoadMore,
  title,
}: {
  items: VideoItem[];
  hasMore: boolean;
  loadingMore: boolean;
  moreError: ApiClientError | null;
  onLoadMore: () => void;
  title: string;
}) {
  const { openVideo } = useAppUi();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [onlyPreset, setOnlyPreset] = useState(false);
  const [sort, setSort] = useState<Sort>("relevance");

  // Only offer sort keys the provider actually returned data for.
  const sortable = useMemo(() => {
    const avail: Sort[] = ["relevance"];
    if (items.some((i) => i.stats.views !== null)) avail.push("views");
    if (items.some((i) => i.stats.likes !== null)) avail.push("likes");
    if (items.some((i) => i.createdAt !== null)) avail.push("newest");
    return avail;
  }, [items]);

  const shown = useMemo(() => {
    const list = onlyPreset ? items.filter((i) => i.captionPresetCount > 0) : [...items];
    const key = (v: VideoItem) => (sort === "views" ? v.stats.views : sort === "likes" ? v.stats.likes : sort === "newest" ? v.createdAt : null) ?? -1;
    if (sort !== "relevance") list.sort((a, b) => key(b) - key(a));
    return list;
  }, [items, onlyPreset, sort]);
  const presetCount = useMemo(() => items.filter((i) => i.captionPresetCount > 0).length, [items]);

  return (
    <section aria-label="Hasil pencarian" className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="mr-auto font-display text-lg font-semibold">
          {title} <span className="text-sm font-normal text-ink-muted">· {items.length} video</span>
        </h2>
        <div className="flex rounded-lg bg-bg-soft p-1" role="group" aria-label="Mode tampilan">
          {(["grid", "list"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              aria-label={v === "grid" ? "Tampilan grid" : "Tampilan list"}
              onClick={() => setView(v)}
              className={cn("inline-flex h-9 w-10 items-center justify-center rounded-md transition", view === v ? "bg-bg-raised text-neon-cyan" : "text-ink-dim hover:text-ink")}
            >
              {v === "grid" ? <LayoutGrid className="h-4 w-4" aria-hidden /> : <List className="h-4 w-4" aria-hidden />}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg bg-bg-soft p-1 text-xs" role="group" aria-label="Filter">
          <button type="button" aria-pressed={!onlyPreset} onClick={() => setOnlyPreset(false)} className={cn("h-8 rounded-md px-3 transition", !onlyPreset ? "bg-bg-raised text-ink" : "text-ink-muted")}>
            Semua Video
          </button>
          <button type="button" aria-pressed={onlyPreset} onClick={() => setOnlyPreset(true)} className={cn("h-8 rounded-md px-3 transition", onlyPreset ? "bg-bg-raised text-ink" : "text-ink-muted")}>
            Preset Terdeteksi ({presetCount})
          </button>
        </div>
        <label className="ml-auto inline-flex items-center gap-1.5 text-xs text-ink-muted">
          <ArrowDownWideNarrow className="h-4 w-4" aria-hidden />
          <span className="sr-only sm:not-sr-only">Urutkan</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-9 rounded-md border border-line/15 bg-bg-soft px-2 text-sm text-ink focus:border-neon-cyan/50 focus:outline-none">
            {sortable.map((s) => (
              <option key={s} value={s}>
                {SORT_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="text-xs text-ink-dim">Badge “Preset Terdeteksi” di daftar hanya berdasarkan caption. Buka Detail untuk memindai komentar & bio.</p>

      {shown.length === 0 ? (
        <EmptyState
          icon={<SearchX className="h-6 w-6" aria-hidden />}
          title={onlyPreset ? "Tidak ada caption dengan link preset" : "Tidak ada video"}
          description={onlyPreset ? "Coba tampilkan semua video lalu buka detailnya — link sering ada di komentar." : "Coba kata kunci lain."}
          action={onlyPreset ? <Button onClick={() => setOnlyPreset(false)}>Tampilkan semua</Button> : undefined}
        />
      ) : (
        <ul className={view === "grid" ? "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4" : "grid gap-3 lg:grid-cols-2"}>
          {shown.map((v, i) => (
            <VideoCard key={v.id} video={v} view={view} onOpen={openVideo} index={i} />
          ))}
        </ul>
      )}

      {moreError && <p className="text-center text-sm text-danger">{moreError.message}</p>}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={onLoadMore} disabled={loadingMore} icon={loadingMore ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : undefined}>
            {loadingMore ? "Memuat…" : moreError ? "Coba muat lagi" : "Muat lebih banyak"}
          </Button>
        </div>
      )}
    </section>
  );
}
