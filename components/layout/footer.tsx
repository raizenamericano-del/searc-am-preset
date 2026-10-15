import { Coffee, Heart, MessageCircle, Send, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { COMMUNITY_LINKS } from "@/lib/config/public";
import { APP_VERSION } from "@/lib/config/app";
import { LogoMark } from "./logo";

function CommunityLink({ href, icon, label, envName }: { href: string | null; icon: ReactNode; label: string; envName: string }) {
  if (!href) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-line/20 p-3 text-sm text-ink-dim" title={`Atur ${envName} untuk mengaktifkan`}>
        <span className="opacity-60">{icon}</span>
        <span className="min-w-0">
          <span className="block">{label}</span>
          <span className="block break-all font-mono text-[10px]">belum dikonfigurasi · {envName}</span>
        </span>
      </div>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="card flex items-center gap-3 p-3 text-sm transition hover:border-neon-cyan/40">
      <span className="text-neon-cyan">{icon}</span>
      {label}
    </a>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line/10 bg-bg-soft/50 pb-24 md:pb-10">
      <div className="mx-auto grid max-w-shell grid-cols-[minmax(0,1fr)] gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-9 w-9" />
            <span className="font-display font-semibold">AM Pencari Preset</span>
          </div>
          <p className="mt-3 max-w-prose text-sm text-ink-muted">
            Toolkit gratis untuk editor video: temukan, simpan, dan bagikan tautan preset dari TikTok. Data video berasal dari provider pihak ketiga (TikWM); bookmark & riwayat hanya tersimpan di perangkat Anda.
          </p>
          <p className="mt-3 text-xs text-ink-dim">v{APP_VERSION}</p>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold">Komunitas</h2>
          <div className="grid gap-2">
            <CommunityLink href={COMMUNITY_LINKS.whatsapp} icon={<MessageCircle className="h-4 w-4" aria-hidden />} label="Gabung grup WhatsApp" envName="NEXT_PUBLIC_WHATSAPP_URL" />
            <CommunityLink href={COMMUNITY_LINKS.telegram} icon={<Send className="h-4 w-4" aria-hidden />} label="Gabung grup Telegram" envName="NEXT_PUBLIC_TELEGRAM_URL" />
          </div>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold">Dukung Proyek</h2>
          <div className="grid gap-2">
            <CommunityLink href={COMMUNITY_LINKS.saweria} icon={<Heart className="h-4 w-4" aria-hidden />} label="Dukung via Saweria" envName="NEXT_PUBLIC_SAWERIA_URL" />
            <CommunityLink href={COMMUNITY_LINKS.trakteer} icon={<Coffee className="h-4 w-4" aria-hidden />} label="Traktir via Trakteer" envName="NEXT_PUBLIC_TRAKTEER_URL" />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-shell px-4 sm:px-6">
        <div className="flex gap-3 rounded-xl border border-line/10 p-4 text-xs leading-relaxed text-ink-dim">
          <ShieldCheck className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
          <p>
            <b className="text-ink-muted">Disclaimer:</b> AM Pencari Preset tidak berafiliasi dengan TikTok, Alight Motion, CapCut, atau VN. Kami tidak meng-host file preset; semua tautan milik pembuatnya masing-masing. Periksa
            tautan sebelum mengunduh, hormati hak cipta kreator, dan patuhi ketentuan layanan tiap platform.
          </p>
        </div>
      </div>
    </footer>
  );
}
