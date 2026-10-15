import type { LinkValidation, PresetPlatform } from "@/types";
import type { BadgeTone } from "@/components/ui/badge";

export const PLATFORM_TONE: Record<PresetPlatform, BadgeTone> = {
  alight_motion: "am",
  xml_pack: "xml",
  capcut: "capcut",
  vn: "vn",
  other: "other",
};

export const VALIDATION_TONE: Record<LinkValidation, BadgeTone> = {
  verified: "success",
  candidate: "warn",
  resolved: "blue",
  unchecked: "neutral",
  blocked: "danger",
};

export const SOURCE_LABEL = { caption: "Caption", comment: "Komentar", bio: "Bio kreator", metadata: "Teks manual" } as const;
