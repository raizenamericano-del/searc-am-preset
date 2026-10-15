"use client";
import { Globe, Copy, ExternalLink, Info, ShieldQuestion, Smartphone } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useAppUi } from "@/components/providers/app-ui";
import { useEnvironment } from "@/hooks/use-environment";
import { usePresetActions } from "@/hooks/use-preset-actions";
import { buildChromeIntent, PLATFORM_HELP, validateOpenableUrl } from "@/lib/client/open-link";
import { PLATFORM_LABEL } from "@/lib/extractor/patterns";
import { displayUrl } from "@/lib/utils/format";

const IN_APP_NAME = { tiktok: "TikTok", instagram: "Instagram", facebook: "Facebook", line: "LINE", twitter: "X/Twitter" } as const;

export default function OpenGuideModal() {
  const { openRequest, setOpenRequest } = useAppUi();
  const { inApp, os } = useEnvironment();
  const { open, copy } = usePresetActions();
  const req = openRequest;
  const valid = req ? validateOpenableUrl(req.url) : null;
  const intent = valid && os === "android" ? buildChromeIntent(valid.url) : null;
  const close = () => setOpenRequest(null);

  return (
    <Modal open={Boolean(req && valid)} onClose={close} title="Membuka Preset" description={valid ? displayUrl(valid.url.toString(), 48) : undefined} size="sm">
      {req && valid && (
        <div className="space-y-4 text-sm">
          {req.reason === "unknown_domain" && (
            <div className="flex gap-3 rounded-lg border border-warn/30 bg-warn/10 p-3 text-warn">
              <ShieldQuestion className="h-5 w-5 shrink-0" aria-hidden />
              <p>
                Domain <b>{valid.url.hostname}</b> tidak termasuk host preset yang dikenal. Pastikan Anda memercayai tujuan ini sebelum membuka.
              </p>
            </div>
          )}
          {inApp && (
            <div className="flex gap-3 rounded-lg border border-neon-cyan/25 bg-neon-cyan/5 p-3">
              <Smartphone className="h-5 w-5 shrink-0 text-neon-cyan" aria-hidden />
              <div className="space-y-1 text-ink-muted">
                <p className="font-medium text-ink">Anda sedang memakai browser internal {IN_APP_NAME[inApp]}.</p>
                <p>
                  Browser internal sering memblokir pembukaan aplikasi lain.{" "}
                  {os === "ios" ? "Ketuk ikon ••• / bagikan lalu pilih “Buka di Safari”." : "Ketuk menu ⋮ lalu pilih “Buka di browser”, atau gunakan tombol Chrome di bawah."}
                </p>
              </div>
            </div>
          )}
          <div className="flex gap-3 rounded-lg bg-bg-soft/70 p-3 text-ink-muted">
            <Info className="h-5 w-5 shrink-0 text-ink-dim" aria-hidden />
            <p>
              {req.platform ? <b className="text-ink">{PLATFORM_LABEL[req.platform]}: </b> : null}
              {PLATFORM_HELP[req.platform ?? "other"]} Perilaku buka-aplikasi berbeda di tiap perangkat, jadi aplikasi tidak selalu terbuka otomatis.
            </p>
          </div>
          <div className="grid gap-2">
            <Button
              variant="primary"
              onClick={() => {
                open(valid.url.toString(), req.platform, { skipChecks: true });
                close();
              }}
              icon={<ExternalLink className="h-4 w-4" aria-hidden />}
            >
              Buka sekarang
            </Button>
            {intent && inApp && (
              <a
                href={intent}
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-line/15 bg-bg-raised text-sm transition hover:border-neon-cyan/40"
              >
                <Globe className="h-4 w-4" aria-hidden /> Buka di Chrome
              </a>
            )}
            <Button onClick={() => void copy(valid.url.toString())} icon={<Copy className="h-4 w-4" aria-hidden />}>
              Salin link
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
