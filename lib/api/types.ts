import type { SearchResponse, VideoItem } from "@/types";

export interface ProviderComment {
  id: string;
  text: string;
  authorUsername: string | null;
}

export interface CommentPage {
  comments: ProviderComment[];
  total: number | null;
}

export interface MediaSources {
  play: string | null;
  hdplay: string | null;
  music: string | null;
}

export interface ProviderCapabilities {
  videoDetails: boolean;
  comments: boolean;
  keywordSearch: boolean;
  creatorVideos: boolean;
  creatorBio: boolean;
}

/**
 * Contract every video-data provider must fulfil. Swap providers by
 * implementing this interface and registering it in lib/api/index.ts.
 */
export interface VideoProvider {
  readonly name: string;
  readonly capabilities: ProviderCapabilities;
  /** Normalise any accepted TikTok input (full URL / short URL / ID) to a canonical video URL. */
  resolveVideoUrl(input: string): Promise<{ id: string | null; url: string }>;
  getVideoDetails(urlOrId: string): Promise<{ video: VideoItem; media: MediaSources }>;
  getComments(video: VideoItem, count?: number): Promise<CommentPage>;
  searchVideos(query: string, cursor: string | null, count?: number): Promise<SearchResponse & { media: Record<string, MediaSources> }>;
  getCreatorVideos(username: string, cursor: string | null, count?: number): Promise<SearchResponse & { media: Record<string, MediaSources> }>;
  getCreatorBio(username: string): Promise<string | null>;
  /** Cheap reachability probe for /api/health. */
  ping(): Promise<boolean>;
}
