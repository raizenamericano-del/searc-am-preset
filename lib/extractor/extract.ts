import type { PresetLink, PresetSource } from "@/types";
import { parsePublicHttpUrl } from "@/lib/security/url";
import { canonicalizeUrl, classifyUrl, findUrlCandidates, isShortlinkUrl } from "./patterns";
import type { ShortlinkOutcome } from "./shortlink";

export interface TextSource {
  text: string;
  source: PresetSource;
  context?: string;
}

export interface ExtractOptions {
  /** Resolves bit.ly / s.id / … — omit to skip network resolution (links become "unchecked"). */
  resolveShortlink?: (url: string) => Promise<ShortlinkOutcome>;
  now?: () => Date;
  maxLinks?: number;
  maxShortlinks?: number;
}

function stableId(input: string): string {
  // FNV-1a 32-bit — deterministic, short, good enough for UI keys / bookmark IDs
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return `pl_${(h >>> 0).toString(36)}`;
}

/**
 * Extract preset links from provider-supplied text sources.
 * Only text the provider actually returned should be passed in —
 * nothing is invented here.
 */
export async function extractPresetLinks(sources: TextSource[], options: ExtractOptions = {}): Promise<PresetLink[]> {
  const now = (options.now ?? (() => new Date()))().toISOString();
  const maxLinks = options.maxLinks ?? 40;
  const maxShort = options.maxShortlinks ?? 8;
  const byKey = new Map<string, PresetLink>();
  let shortBudget = maxShort;

  for (const src of sources) {
    for (const raw of findUrlCandidates(src.text)) {
      if (byKey.size >= maxLinks) break;
      const parsed = parsePublicHttpUrl(raw);
      if (!parsed) continue; // internal / malformed URLs are silently ignored

      const direct = classifyUrl(parsed);
      if (direct) {
        const canonical = canonicalizeUrl(parsed);
        if (byKey.has(canonical)) continue;
        byKey.set(canonical, {
          id: stableId(canonical),
          originalUrl: raw,
          canonicalUrl: canonical,
          platform: direct.platform,
          source: src.source,
          validation: direct.validation,
          domain: parsed.hostname.replace(/^www\./, ""),
          analyzedAt: now,
          context: src.context,
        });
        continue;
      }

      if (!isShortlinkUrl(parsed)) continue; // unrelated link — not a preset
      const shortHost = parsed.hostname.replace(/^www\./, "");
      const shortKey = canonicalizeUrl(parsed);
      if ([...byKey.values()].some((l) => l.originalUrl === raw || l.id === stableId(`short:${shortKey}`))) continue;

      let outcome: ShortlinkOutcome = { status: "unchecked" };
      if (options.resolveShortlink && shortBudget > 0) {
        shortBudget--;
        try {
          outcome = await options.resolveShortlink(parsed.toString());
        } catch {
          outcome = { status: "unchecked" };
        }
      }

      if (outcome.status === "resolved") {
        const dest = parsePublicHttpUrl(outcome.url);
        if (!dest) {
          outcome = { status: "blocked" };
        } else {
          const canonical = canonicalizeUrl(dest);
          if (byKey.has(canonical)) continue;
          const cls = classifyUrl(dest);
          byKey.set(canonical, {
            id: stableId(canonical),
            originalUrl: raw,
            canonicalUrl: canonical,
            platform: cls?.platform ?? "other",
            source: src.source,
            validation: cls?.validation === "verified" ? "verified" : "resolved",
            domain: dest.hostname.replace(/^www\./, ""),
            analyzedAt: now,
            viaShortlink: shortHost,
            context: src.context,
          });
          continue;
        }
      }

      byKey.set(`short:${shortKey}`, {
        id: stableId(`short:${shortKey}`),
        originalUrl: raw,
        canonicalUrl: outcome.status === "blocked" ? null : shortKey,
        platform: "other",
        source: src.source,
        validation: outcome.status === "blocked" ? "blocked" : "unchecked",
        domain: shortHost,
        analyzedAt: now,
        viaShortlink: shortHost,
        context: src.context,
      });
    }
  }
  return [...byKey.values()];
}
