"use client";
import { Bookmark, Copy, ExternalLink, History, Link2, QrCode, Search, Trash2, User, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { PresetPlatform, SearchMode } from "@/types";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { useAppUi } from "@/components/providers/app-ui";
import { PLATFORM_TONE } from "@/components/preset/platform";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { useHistory } from "@/hooks/use-history";
import { usePresetActions } from "@/hooks/use-preset-actions";
import { PLATFORM_LABEL } from "@/lib/extractor/patterns";
import { filterBookmarks } from "@/lib/storage/bookmarks";
import { cn, displayUrl, timeAgo } from "@/lib/utils/format";

const FILTERS: Array<{ id: PresetPlatform | "all"; label: string }> = [
  { id: "all", label: "Semua" },
  { id: "alight_motion", label: "Alight Motion" },
  { id: "xml_pack", label: "XML / Pack" },
  { id: "capcut", label: "CapCut" },
  { id: "vn", label: "VN" },
  { id: "other", label: "Lainnya" },
];

const MODE_META: Record<SearchMode, { label: string; icon: typeof Link2 }> = {
  link: { label: "Tautan", icon: Link2 },
  keyword: { label: "Kata kunci", icon: Search },
  creator: { label: "Kreator", icon: User },
};

function SavedTab() {
  const { items, remove, clear } = useBookmarks();
  const { open, copy } = usePresetActions();
  const { openQr } = useAppUi();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<PresetPlatform | "all">("all");
  const [confirming, setConfirming] = useState(false);
  const list = useMemo(() => filterBookmarks(items, q, filter), [items, q, filter]);

  if (!items.length) {
    return <EmptyState icon={<Bookmark className="h-6 w-6" aria-hidden />} title="Belum ada preset tersimpan" description="Tekan “Simpan” pada kartu preset untuk menyimpannya di perangkat ini." />;
  }
  return (
    <div className="space-y-3">
      <label className="relative block">
        <span className="sr-only">Cari bookmark</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-dim" aria-hidden />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari link, domain, kreator…" className="h-11 w-full rounded-lg border border-line/15 bg-bg-soft pl-9 pr-3 text-ink placeholder:text-ink-dim focus:border-neon-cyan/50 focus:outline-none" />
      </label>
      <div className="scrollbar-none -mx-5 flex gap-1.5 overflow-x-auto px-5" role="group" aria-label="Filter kategori">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={cn("h-8 shrink-0 rounded-full border px-3 text-xs transition", filter === f.id ? "border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan" : "border-line/15 text-ink-muted hover:text-ink")}
          >
            {f.label}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-muted">Tidak ada bookmark yang cocok.</p>
      ) : (
        <ul className="space-y-2">
          {list.map((b) => (
            <li key={b.id} className="card p-3">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={PLATFORM_TONE[b.platform]}>{PLATFORM_LABEL[b.platform]}</Badge>
                    <span className="text-[11px] text-ink-dim">{timeAgo(b.savedAt)}</span>
                  </div>
                  <p className="mt-1.5 break-all font-mono text-xs text-ink">{displayUrl(b.url, 70)}</p>
                  {b.author && <p className="mt-0.5 truncate text-[11px] text-ink-dim">dari @{b.author}</p>}
                </div>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <Button size="sm" variant="primary" onClick={() => open(b.url, b.platform)} icon={<ExternalLink className="h-3.5 w-3.5" aria-hidden />}>
                  Buka
                </Button>
                <Button size="sm" onClick={() => void copy(b.url)} icon={<Copy className="h-3.5 w-3.5" aria-hidden />} aria-label="Salin link">
                  Salin
                </Button>
                <Button size="sm" onClick={() => openQr(b.url)} icon={<QrCode className="h-3.5 w-3.5" aria-hidden />} aria-label="Buat QR">
                  QR
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-auto"
                  onClick={() => {
                    remove(b.id);
                    toast("Bookmark dihapus.", "info");
                  }}
                  icon={<Trash2 className="h-3.5 w-3.5" aria-hidden />}
                  aria-label={`Hapus bookmark ${b.domain}`}
                >
                  Hapus
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="pt-2">
        {confirming ? (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm">
            <span className="flex-1">Hapus semua {items.length} bookmark?</span>
            <Button size="sm" variant="danger" onClick={() => { clear(); setConfirming(false); toast("Semua bookmark dihapus.", "info"); }}>
              Ya, hapus
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
              Batal
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setConfirming(true)} icon={<Trash2 className="h-4 w-4" aria-hidden />}>
            Hapus semua bookmark
          </Button>
        )}
      </div>
    </div>
  );
}

function HistoryTab() {
  const { items, remove, clear } = useHistory();
  const { requestSearch } = useAppUi();
  if (!items.length) return <EmptyState icon={<History className="h-6 w-6" aria-hidden />} title="Riwayat kosong" description="8 pencarian terakhir akan muncul di sini (hanya di perangkat ini)." />;
  return (
    <div className="space-y-2">
      <ul className="space-y-1.5">
        {items.map((h) => {
          const M = MODE_META[h.mode];
          return (
            <li key={h.id} className="flex items-center gap-1 rounded-lg border border-line/10 bg-bg-soft/60">
              <button type="button" onClick={() => requestSearch(h.mode, h.query)} className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left" aria-label={`Ulangi pencarian ${M.label}: ${h.query}`}>
                <M.icon className="h-4 w-4 shrink-0 text-neon-cyan" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{h.query}</span>
                  <span className="text-[11px] text-ink-dim">
                    {M.label} · {timeAgo(h.at)}
                  </span>
                </span>
              </button>
              <button type="button" onClick={() => remove(h.id)} className="mr-1 inline-flex h-10 w-10 items-center justify-center rounded-md text-ink-dim hover:bg-white/5 hover:text-ink" aria-label={`Hapus riwayat ${h.query}`}>
                <X className="h-4 w-4" aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>
      <Button size="sm" variant="ghost" onClick={clear} icon={<Trash2 className="h-4 w-4" aria-hidden />}>
        Hapus seluruh riwayat
      </Button>
    </div>
  );
}

export default function LibraryDrawer() {
  const { libraryTab, openLibrary, closeLibrary } = useAppUi();
  const { items } = useBookmarks();
  const history = useHistory();
  const tab = libraryTab ?? "saved";
  return (
    <Modal open={libraryTab !== null} onClose={closeLibrary} title="Koleksi Saya" description="Tersimpan secara lokal di browser ini — bukan sinkronisasi akun." variant="drawer">
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-bg-soft p-1" role="tablist" aria-label="Koleksi">
        {(["saved", "history"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => openLibrary(t)}
            className={cn("flex h-10 items-center justify-center gap-2 rounded-md text-sm transition", tab === t ? "bg-bg-raised text-ink shadow-card" : "text-ink-muted hover:text-ink")}
          >
            {t === "saved" ? <Bookmark className="h-4 w-4" aria-hidden /> : <History className="h-4 w-4" aria-hidden />}
            {t === "saved" ? `Tersimpan (${items.length})` : `Riwayat (${history.items.length})`}
          </button>
        ))}
      </div>
      <div role="tabpanel">{tab === "saved" ? <SavedTab /> : <HistoryTab />}</div>
    </Modal>
  );
}
