"use client";
import { Bookmark, History, ScanLine, Search } from "lucide-react";
import { useAppUi } from "@/components/providers/app-ui";
import { useBookmarks } from "@/hooks/use-bookmarks";

/** Thumb-reachable bottom navigation for phones. */
export function MobileNav() {
  const { openLibrary, setScannerOpen } = useAppUi();
  const { items } = useBookmarks();
  const btn = "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] text-ink-muted transition active:scale-95 hover:text-ink";
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line/10 bg-bg/85 pb-safe-b backdrop-blur-xl md:hidden" aria-label="Navigasi bawah">
      <div className="flex h-16">
        <button
          type="button"
          className={btn}
          onClick={() => {
            document.getElementById("cari")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        >
          <Search className="h-5 w-5" aria-hidden /> Cari
        </button>
        <button type="button" className={btn} onClick={() => setScannerOpen(true)}>
          <span className="-mt-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-neon-cyan to-neon-violet text-bg shadow-glow-cyan">
            <ScanLine className="h-5 w-5" aria-hidden />
          </span>
          Scan QR
        </button>
        <button type="button" className={btn} onClick={() => openLibrary("saved")}>
          <span className="relative">
            <Bookmark className="h-5 w-5" aria-hidden />
            {items.length > 0 && <span className="absolute -right-2 -top-1 rounded-full bg-neon-cyan px-1 text-[9px] font-bold leading-4 text-bg">{items.length > 99 ? "99+" : items.length}</span>}
          </span>
          Tersimpan
        </button>
        <button type="button" className={btn} onClick={() => openLibrary("history")}>
          <History className="h-5 w-5" aria-hidden /> Riwayat
        </button>
      </div>
    </nav>
  );
}
