import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-display text-5xl font-bold text-gradient">404</p>
      <p className="text-ink-muted">Halaman tidak ditemukan.</p>
      <Link href="/" className="rounded-lg border border-neon-cyan/40 px-4 py-2 text-sm text-neon-cyan hover:bg-neon-cyan/10">
        Kembali ke beranda
      </Link>
    </main>
  );
}
