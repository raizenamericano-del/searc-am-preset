import "server-only";
import type { FeatureStatus } from "@/types";
import { isProviderError } from "./errors";
import { createTikwmProvider } from "./tikwm";
import type { VideoProvider } from "./types";

export type Feature = "videoDetails" | "comments" | "keywordSearch" | "creatorVideos" | "creatorBio";

function safeHttpsUrl(raw: string | undefined): string | undefined {
  if (!raw?.trim()) return undefined;
  try {
    const u = new URL(raw.trim());
    return u.protocol === "https:" ? u.origin : undefined;
  } catch {
    return undefined;
  }
}

const timeoutMs = Math.min(Math.max(Number(process.env.PROVIDER_TIMEOUT_MS) || 10_000, 2000), 20_000);
const minIntervalMs = Math.max(Number(process.env.PROVIDER_MIN_INTERVAL_MS) || 1100, 0);

let primary: VideoProvider | null = null;
let fallback: VideoProvider | null | undefined;

/** Primary provider (TikWM by default). Swap here to change the provider for the whole app. */
export function getProvider(): VideoProvider {
  if (!primary) {
    primary = createTikwmProvider({ baseUrl: safeHttpsUrl(process.env.TIKWM_BASE_URL), timeoutMs, minIntervalMs, name: "tikwm" });
  }
  return primary;
}

/**
 * Optional TikWM-compatible mirror/proxy used for keyword & creator search
 * when the primary provider blocks those endpoints. Configure via
 * SEARCH_FALLBACK_BASE_URL (must speak the same /api/feed/search & /api/user/posts contract).
 */
export function getSearchFallback(): VideoProvider | null {
  if (fallback === undefined) {
    const url = safeHttpsUrl(process.env.SEARCH_FALLBACK_BASE_URL);
    fallback = url ? createTikwmProvider({ baseUrl: url, timeoutMs, minIntervalMs, name: "tikwm-fallback" }) : null;
  }
  return fallback;
}

/* ---------------- runtime feature status (observed, not assumed) ---------------- */

const STATUS_TTL = 15 * 60_000;
const featureState = new Map<Feature, { status: FeatureStatus; at: number }>();

export function recordFeature(feature: Feature, err?: unknown) {
  if (!err) {
    featureState.set(feature, { status: "available", at: Date.now() });
    return;
  }
  if (isProviderError(err)) {
    if (err.kind === "blocked") featureState.set(feature, { status: "blocked", at: Date.now() });
    else if (err.kind === "unsupported") featureState.set(feature, { status: "unsupported", at: Date.now() });
    else if (err.kind === "not_found") featureState.set(feature, { status: "available", at: Date.now() });
  }
}

export function getFeatureStatus(feature: Feature): FeatureStatus {
  const s = featureState.get(feature);
  if (!s || Date.now() - s.at > STATUS_TTL) return "unknown";
  return s.status;
}

/** Run a provider call and record whether the feature actually worked. */
export async function tracked<T>(feature: Feature, fn: () => Promise<T>): Promise<T> {
  try {
    const out = await fn();
    recordFeature(feature);
    return out;
  } catch (err) {
    recordFeature(feature, err);
    throw err;
  }
}

/** Test hook */
export function __resetProviderState() {
  featureState.clear();
  primary = null;
  fallback = undefined;
}
