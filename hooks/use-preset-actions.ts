"use client";
import { useCallback } from "react";
import type { PresetPlatform } from "@/types";
import { useAppUi } from "@/components/providers/app-ui";
import { useToast } from "@/components/ui/toast";
import { copyText } from "@/lib/client/clipboard";
import { detectInAppBrowser, openInNewTab, validateOpenableUrl } from "@/lib/client/open-link";

/** Shared "Buka Preset" + "Salin" behaviour (smart deep-link handler). */
export function usePresetActions() {
  const toast = useToast();
  const { setOpenRequest } = useAppUi();

  const open = useCallback(
    (rawUrl: string, platform: PresetPlatform | null = null, opts: { skipChecks?: boolean } = {}) => {
      const v = validateOpenableUrl(rawUrl);
      if (!v) {
        toast("Link ditolak: hanya URL http/https publik yang dapat dibuka.", "error");
        return;
      }
      const inApp = detectInAppBrowser(navigator.userAgent);
      if (!opts.skipChecks && (inApp || !v.known)) {
        setOpenRequest({ url: v.url.toString(), platform: platform ?? v.platform, reason: inApp ? "in_app" : "unknown_domain" });
        return;
      }
      openInNewTab(v.url);
      toast("Membuka link di tab baru. Jika aplikasi tidak terbuka otomatis, ikuti panduan di halaman tujuan.", "info");
    },
    [setOpenRequest, toast],
  );

  const copy = useCallback(
    async (text: string) => {
      const ok = await copyText(text);
      toast(ok ? "Link disalin ke clipboard." : "Gagal menyalin. Tekan lama pada link untuk menyalin manual.", ok ? "success" : "error");
      return ok;
    },
    [toast],
  );

  const help = useCallback(
    (url: string, platform: PresetPlatform | null) => setOpenRequest({ url, platform, reason: "help" }),
    [setOpenRequest],
  );

  return { open, copy, help };
}
