import { Clapperboard, FileArchive, Layers, QrCode, Radar } from "lucide-react";

const BADGES = [
  { icon: Layers, label: "AM Preset Finder" },
  { icon: FileArchive, label: "XML / Project Pack" },
  { icon: Clapperboard, label: "CapCut & VN" },
  { icon: Radar, label: "Smart Link Detection" },
  { icon: QrCode, label: "QR Preset Tools" },
];

export function Hero() {
  return (
    <section className="relative pb-6 pt-8 text-center sm:pb-10 sm:pt-16">
      <p className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-neon-cyan/25 bg-neon-cyan/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-neon-cyan">
        <span className="h-1.5 w-1.5 rounded-full bg-neon-cyan" aria-hidden /> TikTok Preset Toolkit
      </p>
      <h1 className="mx-auto max-w-3xl font-display text-[2rem] font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
        Temukan <span className="text-gradient">preset</span> di balik setiap video edit.
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-ink-muted sm:text-lg">
        Tempel link TikTok, cari kata kunci, atau telusuri kreator. AM Pencari Preset memindai caption, komentar & bio untuk menemukan link Alight Motion, XML, CapCut, dan VN.
      </p>
      <ul className="scrollbar-none -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 sm:mx-auto sm:max-w-3xl sm:flex-wrap sm:justify-center" aria-label="Fitur">
        {BADGES.map(({ icon: Icon, label }) => (
          <li key={label} className="glass inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-ink">
            <Icon className="h-3.5 w-3.5 text-neon-cyan" aria-hidden />
            {label}
          </li>
        ))}
      </ul>
    </section>
  );
}
