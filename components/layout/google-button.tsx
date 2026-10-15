"use client";
import { Info, LogIn } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";

/** Honest placeholder: Google sign-in is not enabled; no fake auth state, no password prompts. */
export function GoogleButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 w-9 items-center justify-center gap-2 rounded-lg border border-line/15 text-sm sm:h-10 sm:w-auto sm:px-3 text-ink-muted transition hover:border-line/30 hover:text-ink"
        aria-label="Masuk dengan Google (belum diaktifkan)"
      >
        <LogIn className="h-4 w-4" aria-hidden />
        <span className="hidden lg:inline">Masuk</span>
        <span className="hidden rounded bg-white/5 px-1.5 sm:inline py-0.5 text-[10px] uppercase tracking-wide text-ink-dim">Segera</span>
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Masuk dengan Google" size="sm">
        <div className="flex gap-3 text-sm text-ink-muted">
          <Info className="h-5 w-5 shrink-0 text-neon-cyan" aria-hidden />
          <div className="space-y-2">
            <p>Fitur login belum diaktifkan pada instance ini.</p>
            <p>Semua fitur tetap bisa dipakai tanpa akun. Bookmark dan riwayat disimpan secara lokal di browser perangkat Anda (tidak disinkronkan).</p>
          </div>
        </div>
      </Modal>
    </>
  );
}
