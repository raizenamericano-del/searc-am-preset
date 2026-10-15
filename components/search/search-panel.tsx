"use client";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ClipboardPaste, History, Link2, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { SearchMode } from "@/types";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/states";
import { VideoCardSkeleton } from "@/components/ui/skeleton";
import { useAppUi } from "@/components/providers/app-ui";
import { VideoDetail } from "@/components/video/video-detail";
import { useHistory } from "@/hooks/use-history";
import { useSearch } from "@/hooks/use-search";
import { cn } from "@/lib/utils/format";
import { LoadingStages } from "./loading-stages";
import { ResultsView } from "./results-view";
import { MODES, validateQuery } from "./search-modes";

export function SearchPanel() {
  const [mode, setMode] = useState<SearchMode>("link");
  const [queries, setQueries] = useState<Record<SearchMode, string>>({ link: "", keyword: "", creator: "" });
  const [error, setError] = useState<string | null>(null);
  const { state, run, loadMore } = useSearch();
  const history = useHistory();
  const { registerSearchHandler, setScannerOpen } = useAppUi();
  const inputId = useId();
  const errId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const meta = MODES.find((m) => m.id === mode)!;
  const query = queries[mode];

  const submit = (m: SearchMode, q: string) => {
    const msg = validateQuery(m, q);
    if (msg) {
      setError(msg);
      inputRef.current?.focus();
      return;
    }
    setError(null);
    history.add(m, q.trim());
    void run(m, q.trim());
    window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  // Allow the history drawer to repeat a search (handler is called from an event, not an effect).
  const submitRef = useRef(submit);
  useEffect(() => {
    submitRef.current = submit;
  });
  useEffect(() => {
    registerSearchHandler((m, q) => {
      setMode(m);
      setQueries((prev) => ({ ...prev, [m]: q }));
      submitRef.current(m, q);
    });
    return () => registerSearchHandler(null);
  }, [registerSearchHandler]);

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setQueries((q) => ({ ...q, [mode]: text.trim().slice(0, 2048) }));
    } catch {
      setError("Browser tidak mengizinkan membaca clipboard. Tempel manual (tekan lama → Tempel).");
    }
  };

  const recent = history.items.slice(0, 4);

  return (
    <div className="space-y-6">
      <div id="cari" className="card border-gradient scroll-mt-24 p-3 sm:p-5">
        <div role="tablist" aria-label="Mode pencarian" className="grid grid-cols-3 gap-1 rounded-xl bg-bg-soft p-1">
          {MODES.map((m) => (
            <button
              key={m.id}
              role="tab"
              type="button"
              aria-selected={mode === m.id}
              aria-controls={`${inputId}-panel`}
              onClick={() => {
                setMode(m.id);
                setError(null);
              }}
              className={cn(
                "relative flex h-11 items-center justify-center gap-1.5 rounded-lg text-xs font-medium transition sm:text-sm",
                mode === m.id ? "text-ink" : "text-ink-muted hover:text-ink",
              )}
            >
              {mode === m.id && <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-lg bg-bg-raised shadow-glow-cyan" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
              <m.icon className="relative h-4 w-4" aria-hidden />
              <span className="relative hidden sm:inline">{m.label}</span>
              <span className="relative sm:hidden">{m.short}</span>
            </button>
          ))}
        </div>

        <form
          id={`${inputId}-panel`}
          role="tabpanel"
          className="mt-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            submit(mode, query);
          }}
        >
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-ink">
            {meta.label}
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <meta.icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-dim" aria-hidden />
              <input
                ref={inputRef}
                id={inputId}
                value={query}
                onChange={(e) => {
                  setQueries((q) => ({ ...q, [mode]: e.target.value }));
                  if (error) setError(null);
                }}
                placeholder={meta.placeholder}
                inputMode={mode === "link" ? "url" : "search"}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                maxLength={mode === "link" ? 2048 : 100}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errId : `${inputId}-help`}
                className={cn(
                  "h-12 w-full min-w-0 rounded-lg border bg-bg-soft pl-10 pr-20 text-ink placeholder:text-ink-dim transition focus:outline-none",
                  error ? "border-danger/60" : "border-line/15 focus:border-neon-cyan/60 focus:shadow-glow-cyan",
                )}
              />
              <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center">
                {query && (
                  <button type="button" onClick={() => setQueries((q) => ({ ...q, [mode]: "" }))} className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-dim hover:text-ink" aria-label="Kosongkan input">
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                )}
                {mode === "link" && (
                  <button type="button" onClick={() => void paste()} className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-dim hover:text-neon-cyan" aria-label="Tempel dari clipboard">
                    <ClipboardPaste className="h-4 w-4" aria-hidden />
                  </button>
                )}
              </div>
            </div>
            <Button type="submit" variant="primary" size="lg" loading={state.status === "loading"} className="sm:w-auto" icon={state.status === "loading" ? undefined : <ArrowRight className="h-4 w-4" aria-hidden />}>
              {mode === "link" ? "Analisis" : "Cari"}
            </Button>
          </div>
          {error ? (
            <p id={errId} role="alert" className="mt-2 text-sm text-danger">
              {error}
            </p>
          ) : (
            <p id={`${inputId}-help`} className="mt-2 text-xs text-ink-dim">
              {meta.help}
            </p>
          )}
          {meta.examples.length > 0 && (
            <div className="scrollbar-none -mx-3 mt-3 flex gap-1.5 overflow-x-auto px-3 sm:mx-0 sm:flex-wrap sm:px-0">
              {meta.examples.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => {
                    setQueries((q) => ({ ...q, [mode]: ex }));
                    submit(mode, ex);
                  }}
                  className="h-8 shrink-0 rounded-full border border-line/15 px-3 text-xs text-ink-muted transition hover:border-neon-cyan/40 hover:text-neon-cyan"
                >
                  {ex}
                </button>
              ))}
            </div>
          )}
        </form>

        {recent.length > 0 && (
          <div className="mt-4 border-t border-line/10 pt-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs text-ink-dim">
              <History className="h-3.5 w-3.5" aria-hidden /> Pencarian terakhir
            </div>
            <ul className="flex flex-wrap gap-1.5">
              {recent.map((h) => (
                <li key={h.id} className="flex max-w-full items-center rounded-full border border-line/15 bg-bg-soft/60 pl-3 text-xs">
                  <button
                    type="button"
                    className="max-w-[14rem] truncate py-1.5 text-ink-muted hover:text-ink"
                    onClick={() => {
                      setMode(h.mode);
                      setQueries((q) => ({ ...q, [h.mode]: h.query }));
                      submit(h.mode, h.query);
                    }}
                    aria-label={`Ulangi pencarian: ${h.query}`}
                  >
                    {h.query}
                  </button>
                  <button type="button" onClick={() => history.remove(h.id)} className="inline-flex h-7 w-7 items-center justify-center rounded-full text-ink-dim hover:text-ink" aria-label={`Hapus ${h.query} dari riwayat`}>
                    <X className="h-3 w-3" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div ref={resultsRef} className="scroll-mt-24">
        <AnimatePresence mode="wait">
          {state.status === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5" aria-busy="true">
              <div className="card p-4">
                <p className="mb-3 truncate text-xs text-ink-dim">“{state.query}”</p>
                <LoadingStages mode={state.mode} stage={state.stage} />
              </div>
              {state.mode !== "link" && (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {Array.from({ length: 8 }, (_, i) => (
                    <VideoCardSkeleton key={i} view="grid" />
                  ))}
                </div>
              )}
            </motion.div>
          )}
          {state.status === "error" && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ErrorState
                title={state.error.code === "PROVIDER_BLOCKED" ? "Fitur diblokir provider" : state.error.code === "NOT_FOUND" ? "Tidak ditemukan" : "Pencarian gagal"}
                message={state.error.message}
                hint={state.error.hint}
                onRetry={() => void run(state.mode, state.query)}
                extra={
                  state.mode !== "link" && state.error.code === "PROVIDER_BLOCKED" ? (
                    <Button variant="ghost" onClick={() => setMode("link")} icon={<Link2 className="h-4 w-4" aria-hidden />}>
                      Pakai mode Tautan Video
                    </Button>
                  ) : undefined
                }
              />
            </motion.div>
          )}
          {state.status === "success" && (
            <motion.div key={`res-${state.mode}-${state.query}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ResultsView
                items={state.items}
                hasMore={state.hasMore}
                loadingMore={state.loadingMore}
                moreError={state.moreError}
                onLoadMore={() => void loadMore()}
                title={state.mode === "creator" ? `Video @${state.query}` : `Hasil “${state.query}”`}
              />
            </motion.div>
          )}
          {state.status === "success-link" && (
            <motion.div key={`link-${state.video.id}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card p-4 sm:p-6">
              <VideoDetail video={state.video} />
            </motion.div>
          )}
        </AnimatePresence>
        {state.status === "idle" && (
          <button type="button" onClick={() => setScannerOpen(true)} className="mx-auto mt-2 block text-center text-xs text-ink-dim underline-offset-4 hover:text-neon-cyan hover:underline">
            Punya QR preset? Pindai dari gambar →
          </button>
        )}
      </div>
    </div>
  );
}
