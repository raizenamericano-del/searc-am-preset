import "server-only";
import type { ExtractionReport, SourceStatus, VideoItem } from "@/types";
import { getFeatureStatus, getProvider, tracked } from "@/lib/api";
import { isProviderError, ProviderError } from "@/lib/api/errors";
import { extractionCache, videoCache } from "@/lib/cache";
import { extractPresetLinks, type TextSource } from "@/lib/extractor/extract";
import { resolveShortlink } from "@/lib/extractor/shortlink";
import { isVideoId } from "@/lib/utils/tiktok-url";
import { mediaStore } from "./media-store";

/** Resolve user input → video metadata (cached by video ID). */
export async function getVideo(input: string): Promise<{ video: VideoItem; cache: "hit" | "miss" }> {
  const provider = getProvider();
  const { id, url } = isVideoId(input) ? { id: input, url: input } : await provider.resolveVideoUrl(input);
  if (id) {
    const cached = videoCache.get(id);
    // list results don't carry a play URL — only treat as hit when it's a full detail entry
    if (cached && cached.playUrl !== undefined) return { video: cached, cache: "hit" };
  }
  const { video, media } = await tracked("videoDetails", () => provider.getVideoDetails(id ?? url));
  videoCache.set(video.id, video);
  mediaStore.set(video.id, media);
  return { video, cache: "miss" };
}

async function videoForExtraction(videoId: string): Promise<VideoItem> {
  const cached = videoCache.get(videoId);
  if (cached) return cached;
  return (await getVideo(videoId)).video;
}

/**
 * Build the extraction report from sources the provider *actually* returned:
 * caption (always), comments (if the endpoint works), creator bio (if available).
 */
export async function extractForVideo(videoId: string): Promise<{ report: ExtractionReport; cache: "hit" | "miss" }> {
  const cached = extractionCache.get(videoId);
  if (cached) return { report: cached, cache: "hit" };
  const provider = getProvider();
  const video = await videoForExtraction(videoId);

  const sources: TextSource[] = [];
  const status: ExtractionReport["sources"] = { caption: "empty", comments: "unavailable", bio: "unavailable" };
  let commentsScanned = 0;

  if (video.caption.trim()) {
    sources.push({ text: video.caption, source: "caption" });
    status.caption = "scanned";
  }

  if (provider.capabilities.comments) {
    try {
      const page = await tracked("comments", () => provider.getComments(video, 50));
      commentsScanned = page.comments.length;
      status.comments = page.comments.length ? "scanned" : "empty";
      const authorName = video.author.username.toLowerCase();
      for (const c of page.comments) {
        const byCreator = c.authorUsername?.toLowerCase() === authorName;
        sources.push({
          text: c.text,
          source: "comment",
          context: byCreator ? "Komentar kreator" : c.authorUsername ? `Komentar @${c.authorUsername}` : "Komentar",
        });
      }
    } catch (err) {
      status.comments = sourceStatusFromError(err);
    }
  }

  const bioStatus = getFeatureStatus("creatorBio");
  if (provider.capabilities.creatorBio && video.author.username !== "_" && bioStatus !== "blocked") {
    try {
      const bio = await tracked("creatorBio", () => provider.getCreatorBio(video.author.username));
      if (bio) {
        sources.push({ text: bio, source: "bio", context: `Bio @${video.author.username}` });
        status.bio = "scanned";
      } else status.bio = "empty";
    } catch (err) {
      status.bio = sourceStatusFromError(err);
    }
  } else if (bioStatus === "blocked") {
    status.bio = "blocked";
  }

  const links = await extractPresetLinks(sources, { resolveShortlink: (u) => resolveShortlink(u) });
  const report: ExtractionReport = {
    videoId: video.id,
    links,
    sources: status,
    commentsScanned,
    analyzedAt: new Date().toISOString(),
  };
  // Cache only when the main sources were processed; partial failures get a short TTL.
  const partial = status.comments === "error" || status.comments === "blocked";
  extractionCache.set(video.id, report, partial ? 60_000 : undefined);
  return { report, cache: "miss" };
}

function sourceStatusFromError(err: unknown): SourceStatus {
  if (isProviderError(err)) {
    if (err.kind === "blocked") return "blocked";
    if (err.kind === "unsupported") return "unavailable";
  }
  return "error";
}

/** Extraction from user-pasted text (caption/comment copied manually). */
export async function extractFromText(text: string) {
  const links = await extractPresetLinks([{ text, source: "metadata", context: "Teks yang ditempel" }], {
    resolveShortlink: (u) => resolveShortlink(u),
  });
  return { links, analyzedAt: new Date().toISOString() };
}

export { ProviderError };
