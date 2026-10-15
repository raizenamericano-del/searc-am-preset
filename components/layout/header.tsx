"use client";
import { Bookmark, ScanLine } from "lucide-react";
import { useAppUi } from "@/components/providers/app-ui";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { LogoMark } from "./logo";
import { StatusIndicator } from "./status-indicator";
import { GoogleButton } from "./google-button";

export function Header() {
  const { openLibrary, setScannerOpen } = useAppUi();
  const { items } = useBookmarks();
  return (
    <header className="sticky top-0 z-40 border-b border-line/10 bg-bg/75 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-shell items-center gap-3 px-4 sm:h-16 sm:px-6">
        <a href="#top" className="flex min-w-0 items-center gap-2.5" aria-label="AM Pencari Preset — ke atas">
          <LogoMark className="h-8 w-8 shrink-0 sm:h-9 sm:w-9" />
          <span className="truncate font-display text-[15px] font-semibold tracking-tight sm:text-base">
            AM <span className="text-gradient">Pencari Preset</span>
          </span>
        </a>
        <div className="ml-auto flex items-center gap-2">
          <StatusIndicator />
          <nav className="hidden items-center gap-2 md:flex" aria-label="Aksi utama">
            <button type="button" onClick={() => setScannerOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm text-ink-muted transition hover:bg-white/5 hover:text-ink">
              <ScanLine className="h-4 w-4" aria-hidden /> Scan QR
            </button>
            <button type="button" onClick={() => openLibrary("saved")} className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm text-ink-muted transition hover:bg-white/5 hover:text-ink">
              <Bookmark className="h-4 w-4" aria-hidden /> Tersimpan
              {items.length > 0 && <span className="rounded-full bg-neon-cyan/15 px-1.5 text-[11px] font-semibold text-neon-cyan">{items.length}</span>}
            </button>
          </nav>
          <GoogleButton />
        </div>
      </div>
    </header>
  );
}
