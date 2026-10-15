"use client";
import { FileSearch, Loader2 } from "lucide-react";
import { useId, useState } from "react";
import type { PresetLink } from "@/types";
import { Button } from "@/components/ui/button";
import { PresetCard } from "@/components/preset/preset-card";
import { ApiClientError, apiPost } from "@/lib/client/api";

/** Paste a caption / pinned comment / bio manually and extract preset links (server resolves shortlinks safely). */
export function TextExtractor() {
  const id = useId();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [links, setLinks] = useState<PresetLink[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (text.trim().length < 4) {
      setError("Tempel teks yang berisi link terlebih dahulu.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const r = await apiPost<{ links: PresetLink[] }>("/api/extract", { text: text.slice(0, 5000) });
      setLinks(r.links);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Gagal mengekstrak.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby={`${id}-h`} className="card p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neon-violet/15 text-[#c79bff]">
          <FileSearch className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h2 id={`${id}-h`} className="font-display text-base font-semibold">
            Ekstrak dari Teks
          </h2>
          <p className="text-sm text-ink-muted">Link ada di komentar tersemat atau bio yang tidak terbaca provider? Salin teksnya lalu tempel di sini.</p>
        </div>
      </div>
      <label htmlFor={id} className="sr-only">
        Teks berisi link preset
      </label>
      <textarea
        id={id}
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={5000}
        rows={4}
        placeholder="Contoh: preset AM ada di sini 👉 alight.link/abc123 atau s.id/presetku"
        className="mt-4 w-full resize-y rounded-lg border border-line/15 bg-bg-soft p-3 text-ink placeholder:text-ink-dim focus:border-neon-cyan/50 focus:outline-none"
        aria-describedby={error ? `${id}-err` : undefined}
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-xs text-ink-dim">{text.length}/5000</span>
        <Button variant="outline" onClick={() => void run()} disabled={busy} icon={busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : undefined}>
          Deteksi Link
        </Button>
      </div>
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
      {links && (
        <div className="mt-4" aria-live="polite">
          {links.length === 0 ? (
            <p className="text-sm text-ink-muted">Tidak ada link preset/shortlink yang dikenali dalam teks tersebut.</p>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {links.map((l, i) => (
                <PresetCard key={l.id} link={l} index={i} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
