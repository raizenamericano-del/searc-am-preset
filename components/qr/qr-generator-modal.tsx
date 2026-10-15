"use client";
import { Copy, Download } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { useRef } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useAppUi } from "@/components/providers/app-ui";
import { usePresetActions } from "@/hooks/use-preset-actions";
import { displayUrl } from "@/lib/utils/format";

const EXPORT_SIZE = 1024;

export default function QrGeneratorModal() {
  const { qrUrl, closeQr } = useAppUi();
  const { copy } = usePresetActions();
  const toast = useToast();
  const exportRef = useRef<HTMLCanvasElement>(null);
  const tooLong = (qrUrl?.length ?? 0) > 1200;

  const download = () => {
    const canvas = exportRef.current;
    if (!canvas) return;
    try {
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `am-preset-qr-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast("QR PNG diunduh.", "success");
    } catch {
      toast("Gagal membuat file PNG.", "error");
    }
  };

  return (
    <Modal open={Boolean(qrUrl)} onClose={closeQr} title="QR Preset" description="Bagikan preset dengan QR — dapat dipindai kamera atau fitur Scan QR." size="sm">
      {qrUrl && (
        <div className="flex flex-col items-center gap-4">
          {tooLong ? (
            <p className="text-sm text-warn">URL terlalu panjang untuk QR yang mudah dipindai.</p>
          ) : (
            <>
              {/* High contrast black-on-white with a 4-module quiet zone */}
              <div className="rounded-2xl bg-white p-3 shadow-glow-cyan">
                <QRCodeCanvas value={qrUrl} size={256} level="M" marginSize={4} bgColor="#ffffff" fgColor="#000000" className="h-60 w-60 sm:h-64 sm:w-64" aria-label="Kode QR untuk link preset" role="img" />
              </div>
              <QRCodeCanvas ref={exportRef} value={qrUrl} size={EXPORT_SIZE} level="M" marginSize={4} bgColor="#ffffff" fgColor="#000000" className="hidden" aria-hidden />
            </>
          )}
          <p className="w-full break-all rounded-lg bg-bg-soft p-2.5 text-center font-mono text-xs text-ink-muted">{displayUrl(qrUrl, 120)}</p>
          <div className="grid w-full grid-cols-2 gap-2">
            <Button variant="primary" onClick={download} disabled={tooLong} icon={<Download className="h-4 w-4" aria-hidden />} data-autofocus>
              Unduh PNG
            </Button>
            <Button onClick={() => void copy(qrUrl)} icon={<Copy className="h-4 w-4" aria-hidden />}>
              Salin URL
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
