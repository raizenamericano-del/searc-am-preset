import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Hero } from "@/components/layout/hero";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ModalsHost } from "@/components/layout/modals-host";
import { SearchPanel } from "@/components/search/search-panel";
import { TextExtractor } from "@/components/search/text-extractor";

export default function HomePage() {
  return (
    <div id="top" className="relative min-h-dvh">
      {/* decorative background */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[680px] overflow-hidden">
        <div className="grid-bg absolute inset-0" />
        <div className="absolute -left-32 -top-24 h-80 w-80 animate-drift rounded-full bg-neon-cyan/20 blur-[110px]" />
        <div className="absolute -right-24 top-24 h-80 w-80 animate-drift rounded-full bg-neon-violet/20 blur-[120px] [animation-delay:-4s]" />
      </div>
      <Header />
      <main className="mx-auto max-w-shell px-4 sm:px-6">
        <Hero />
        <SearchPanel />
        <div className="mt-10">
          <TextExtractor />
        </div>
      </main>
      <Footer />
      <MobileNav />
      <ModalsHost />
    </div>
  );
}
