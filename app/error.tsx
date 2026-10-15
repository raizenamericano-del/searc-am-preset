"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-display text-2xl font-semibold">Terjadi kesalahan tampilan</p>
      <p className="max-w-prose text-sm text-ink-muted">Muat ulang halaman. Data tersimpan Anda tetap aman di perangkat ini.</p>
      <button type="button" onClick={reset} className="rounded-lg border border-neon-cyan/40 px-4 py-2 text-sm text-neon-cyan hover:bg-neon-cyan/10">
        Coba lagi
      </button>
    </main>
  );
}
