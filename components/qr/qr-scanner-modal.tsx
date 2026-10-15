"use client";
import { AlertTriangle, Copy, ExternalLink, ImageUp, Loader2, RotateCcw, ScanLine, ShieldAlert } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppUi } from "@/components/providers/app-ui";
import { usePresetActions } from "@/hooks/use-preset-actions";
import { PLATFORM_LABEL } from "@/lib/extractor/patterns";
import { decodeQrFromFile } from "@/lib/qr/decode";
import { classifyQrPayload, type QrPayload } from "@/lib/qr/payload";
import { cn } from "@/lib/utils/format";

type ScanState = { status: "idle" } | { status: "scanning" } | { status: "done"; payload: QrPayload } | { status: "unreadable" } | { status: "error"; message: string };

/** Everything happens locally in the browser — the image is never uploaded. */
export default function QrScannerModal() {
  const { scannerOpen, setScannerOpen } = useAppUi();
  const { open, copy } = usePresetActions();
  const [state, setState] = useState<ScanState>({ status: "idle" });
  const [preview, setPreview] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setPreview((p) => {
      if (p) URL.revokeObjectURL(p);
      return null;
    });
    setState({ status: "idle" });
    if (input.current) input.current.value = "";
  }, []);

  // The modal is unmounted when closed (see ModalsHost) — just release the object URL.
  const previewRef = useRef<string | null>(null);
  useEffect(() => {
    previewRef.current = preview;
  }, [preview]);
  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    [],
  );

  const handle = async (file: File | undefined) => {
    if (!file) return;
    setState({ status: "scanning" });
    try {
      const { text, previewUrl } = await decodeQrFromFile(file);
      setPreview((p) => {
        if (p) URL.revokeObjectURL(p);
        return previewUrl;
      });
      setState(text ? { status: "done", payload: classifyQrPayload(text) } : { status: "unreadable" });
    } catch (err) {
      setState({ status: "error", message: err instanceof Error ? err.message : "Gagal membaca gambar." });
    }
  };

  return (
    <Modal open={scannerOpen} onClose={() => setScannerOpen(false)} title="Scan QR Preset" description="Unggah gambar/screenshot QR. Diproses di perangkat Anda, tidak diunggah ke server." size="md">
      <div className="space-y-4">
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            void handle(e.dataTransfer.files[0]);
          }}
          className={cn(
            "relative flex min-h-48 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed p-4 text-center transition",
            drag ? "border-neon-cyan bg-neon-cyan/5" : "border-line/20 hover:border-neon-cyan/50",
          )}
        >
          <input
            ref={input}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/bmp"
            className="sr-only"
            data-autofocus
            onChange={(e) => void handle(e.target.files?.[0])}
            aria-label="Pilih gambar QR dari galeri atau file"
          />
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Pratinjau gambar QR" className="max-h-56 rounded-lg object-contain" />
          ) : (
            <>
              <ImageUp className="mb-3 h-9 w-9 text-neon-cyan" aria-hidden />
              <p className="font-medium">Ketuk untuk memilih dari galeri</p>
              <p className="mt-1 text-sm text-ink-muted">atau seret & lepas gambar di sini · maks 10 MB</p>
            </>
          )}
          {state.status === "scanning" && (
            <div className="absolute inset-0 flex items-center justify-center bg-bg/70">
              <div className="absolute inset-x-0 top-0 h-1/3 animate-scan bg-gradient-to-b from-transparent via-neon-cyan/25 to-transparent" />
              <Loader2 className="h-7 w-7 animate-spin text-neon-cyan" aria-hidden />
              <span className="sr-only">Memindai QR…</span>
            </div>
          )}
        </label>

        <div aria-live="polite">
          {state.status === "unreadable" && (
            <div className="flex gap-3 rounded-lg border border-warn/30 bg-warn/10 p-3 text-sm text-warn">
              <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />
              <p>QR tidak terbaca. Coba crop agar QR memenuhi gambar, pastikan tidak buram, dan pencahayaan cukup.</p>
            </div>
          )}
          {state.status === "error" && (
            <div className="flex gap-3 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
              <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />
              <p>{state.message}</p>
            </div>
          )}
          {state.status === "done" && (
            <div className="card space-y-3 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <ScanLine className="h-4 w-4 text-neon-cyan" aria-hidden />
                <span className="text-sm font-semibold">QR terbaca</span>
                {state.payload.kind === "url" && state.payload.link.platform && <Badge tone="success">{PLATFORM_LABEL[state.payload.link.platform]}</Badge>}
                {state.payload.kind === "url" && !state.payload.link.known && <Badge tone="warn">Domain tidak dikenal</Badge>}
              </div>
              <p className="break-all rounded-lg bg-bg-soft p-2.5 font-mono text-[13px]">{state.payload.value}</p>
              {state.payload.kind === "unsafe_url" && (
                <p className="flex gap-2 text-xs text-danger">
                  <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden /> Skema/alamat ini tidak aman atau bukan http/https publik, sehingga tidak dapat dibuka langsung.
                </p>
              )}
              {state.payload.kind === "text" && <p className="text-xs text-ink-muted">Isi QR berupa teks biasa, bukan tautan.</p>}
              <div className="flex flex-wrap gap-2">
                {state.payload.kind === "url" && (
                  <Button variant="primary" size="sm" onClick={() => state.payload.kind === "url" && open(state.payload.value, state.payload.link.platform)} icon={<ExternalLink className="h-4 w-4" aria-hidden />}>
                    Buka Preset
                  </Button>
                )}
                <Button size="sm" onClick={() => void copy(state.payload.value)} icon={<Copy className="h-4 w-4" aria-hidden />}>
                  Salin
                </Button>
              </div>
            </div>
          )}
        </div>
        {state.status !== "idle" && state.status !== "scanning" && (
          <Button variant="ghost" size="sm" onClick={reset} icon={<RotateCcw className="h-4 w-4" aria-hidden />}>
            Scan gambar lain
          </Button>
        )}
      </div>
    </Modal>
  );
}
