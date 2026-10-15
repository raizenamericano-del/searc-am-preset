import { AtSign, Hash, Link2, type LucideIcon } from "lucide-react";
import type { SearchMode } from "@/types";
import { normalizeUsername, parseTikTokInput } from "@/lib/utils/tiktok-url";

export const MODES: Array<{ id: SearchMode; label: string; short: string; icon: LucideIcon; placeholder: string; help: string; examples: string[] }> = [
  {
    id: "link",
    label: "Tautan Video",
    short: "Tautan",
    icon: Link2,
    placeholder: "https://vt.tiktok.com/… atau tiktok.com/@user/video/…",
    help: "Tempel link video TikTok. Kami ambil metadata lalu memindai caption, komentar & bio untuk link preset.",
    examples: [],
  },
  {
    id: "keyword",
    label: "Kata Kunci",
    short: "Kata Kunci",
    icon: Hash,
    placeholder: "contoh: preset alight motion shake",
    help: "Cari video relevan berdasarkan kata kunci (bergantung pada dukungan provider).",
    examples: ["jedag jedug anime", "preset alight motion shake", "XML cinematic", "capcut velocity", "preset jedag jedug 5MB"],
  },
  {
    id: "creator",
    label: "Username Kreator",
    short: "Kreator",
    icon: AtSign,
    placeholder: "@username",
    help: "Lihat daftar video terbaru dari kreator (bergantung pada dukungan provider).",
    examples: [],
  },
];

/** Client-side validation mirroring the server Zod schema. Returns an error message or null. */
export function validateQuery(mode: SearchMode, q: string): string | null {
  const v = q.trim();
  if (!v) return "Kolom pencarian masih kosong.";
  if (mode === "link") return parseTikTokInput(v) ? null : "Tautan tidak valid. Gunakan link tiktok.com/@user/video/…, vt.tiktok.com/… atau vm.tiktok.com/…";
  if (mode === "keyword") {
    if (v.length < 2) return "Kata kunci minimal 2 karakter.";
    if (v.length > 100) return "Kata kunci maksimal 100 karakter.";
    return null;
  }
  return normalizeUsername(v) ? null : "Username tidak valid (2–24 karakter: huruf, angka, titik, garis bawah).";
}
