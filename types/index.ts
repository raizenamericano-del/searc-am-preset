/* Shared domain types — used by both server and client code. */

export type SearchMode = "link" | "keyword" | "creator";

export type PresetPlatform = "alight_motion" | "xml_pack" | "capcut" | "vn" | "other";

export type PresetSource = "caption" | "comment" | "bio" | "metadata";

/**
 * verified    – pattern matched on a known preset host (AM share, CapCut template, VN)
 * candidate   – generic file host (Drive / MediaFire / Mega) — may or may not be a preset
 * resolved    – shortlink successfully resolved to a safe public destination
 * unchecked   – shortlink could not be resolved (shown as-is, not verified)
 * blocked     – destination failed safety checks (never offered as clickable)
 */
export type LinkValidation = "verified" | "candidate" | "resolved" | "unchecked" | "blocked";

export interface PresetLink {
  id: string;
  originalUrl: string;
  canonicalUrl: string | null;
  platform: PresetPlatform;
  source: PresetSource;
  validation: LinkValidation;
  domain: string;
  analyzedAt: string;
  /** If the link came from a shortlink, the original short host (bit.ly, s.id …) */
  viaShortlink?: string;
  /** Free-text context: e.g. comment author */
  context?: string;
}

export interface VideoAuthor {
  id: string | null;
  username: string;
  nickname: string | null;
  avatar: string | null;
}

/** Stats are `null` when the provider did not return them (never faked as 0). */
export interface VideoStats {
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
}

export interface VideoMedia {
  /** Indicates availability only — actual media is streamed through /api/download by ID. */
  video: boolean;
  videoHd: boolean;
  audio: boolean;
  videoSizeBytes: number | null;
  hdSizeBytes: number | null;
}

export interface VideoItem {
  id: string;
  url: string;
  caption: string;
  cover: string | null;
  duration: number | null;
  createdAt: number | null;
  author: VideoAuthor;
  stats: VideoStats;
  media: VideoMedia;
  /** Cheap caption-only scan done while listing results */
  captionPresetCount: number;
  playUrl?: string | null;
  musicTitle?: string | null;
}

export interface SearchResponse {
  mode: SearchMode;
  query: string;
  items: VideoItem[];
  cursor: string | null;
  hasMore: boolean;
  provider: string;
}

export type SourceStatus = "scanned" | "unavailable" | "blocked" | "empty" | "error";

export interface ExtractionReport {
  videoId: string;
  links: PresetLink[];
  sources: {
    caption: SourceStatus;
    comments: SourceStatus;
    bio: SourceStatus;
  };
  commentsScanned: number;
  analyzedAt: string;
}

export interface VideoDetailResponse {
  video: VideoItem;
  extraction: ExtractionReport;
}

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "INVALID_JSON"
  | "PAYLOAD_TOO_LARGE"
  | "RATE_LIMITED"
  | "NOT_FOUND"
  | "PROVIDER_ERROR"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_BLOCKED"
  | "PROVIDER_RATE_LIMITED"
  | "UNSUPPORTED"
  | "INTERNAL";

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
    hint?: string;
  };
}

export type FeatureStatus = "available" | "blocked" | "unsupported" | "unknown" | "not_configured";

export interface HealthResponse {
  status: "ok" | "degraded" | "down";
  version: string;
  provider: {
    name: string;
    reachable: boolean;
  };
  features: {
    videoDetails: FeatureStatus;
    comments: FeatureStatus;
    keywordSearch: FeatureStatus;
    creatorVideos: FeatureStatus;
  };
  auth: { google: "enabled" | "not_configured" };
  checkedAt: string;
}
