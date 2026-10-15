import "server-only";
import type { SearchResponse, VideoItem } from "@/types";
import { countCaptionPresetLinks } from "@/lib/extractor/patterns";
import { resolveRedirects, type HopFn } from "@/lib/security/safe-redirect";
import { isAllowedMediaUrl } from "@/lib/utils/media-hosts";
import { isVideoId, parseTikTokInput, tiktokVideoUrl } from "@/lib/utils/tiktok-url";
import { ProviderError } from "./errors";
import { providerJson } from "./http";
import { createThrottle } from "./throttle";
import type { CommentPage, MediaSources, VideoProvider } from "./types";

/* ---------- tolerant field readers (provider JSON is untrusted) ---------- */

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown): string | null => (typeof v === "string" && v.length > 0 ? v : typeof v === "number" ? String(v) : null);
const num = (v: unknown): number | null => {
  const n = typeof v === "string" && v.trim() !== "" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) && n >= 0 ? n : null;
};

function absolutize(url: string | null, origin: string): string | null {
  if (!url) return null;
  try {
    const abs = new URL(url, origin).toString();
    return isAllowedMediaUrl(abs) ? abs : null;
  } catch {
    return null;
  }
}

/** Map a raw TikWM video object to our normalised VideoItem. Returns null if unusable. */
export function normalizeTikwmVideo(raw: unknown, origin: string): { video: VideoItem; media: MediaSources } | null {
  if (!isObj(raw)) return null;
  const id = str(raw.video_id) ?? str(raw.id) ?? str(raw.aweme_id);
  if (!id || !isVideoId(id)) return null;
  const author = isObj(raw.author) ? raw.author : {};
  const username = str(author.unique_id) ?? "_";
  const caption = (str(raw.title) ?? "").slice(0, 5000);
  const media: MediaSources = {
    play: absolutize(str(raw.play), origin),
    hdplay: absolutize(str(raw.hdplay), origin),
    music: absolutize(str(raw.music) ?? (isObj(raw.music_info) ? str(raw.music_info.play) : null), origin),
  };
  const video: VideoItem = {
    id,
    url: tiktokVideoUrl(id, username),
    caption,
    cover: absolutize(str(raw.cover) ?? str(raw.origin_cover), origin),
    duration: num(raw.duration),
    createdAt: num(raw.create_time),
    author: {
      id: str(author.id),
      username,
      nickname: str(author.nickname),
      avatar: absolutize(str(author.avatar), origin),
    },
    stats: {
      views: num(raw.play_count),
      likes: num(raw.digg_count),
      comments: num(raw.comment_count),
      shares: num(raw.share_count),
    },
    media: {
      video: Boolean(media.play),
      videoHd: Boolean(media.hdplay),
      audio: Boolean(media.music),
      videoSizeBytes: num(raw.size),
      hdSizeBytes: num(raw.hd_size),
    },
    captionPresetCount: countCaptionPresetLinks(caption),
    musicTitle: isObj(raw.music_info) ? str(raw.music_info.title) : null,
  };
  return { video, media };
}

/** Validate the TikWM envelope `{ code, msg, data }` and translate failures. */
export function unwrapTikwm(payload: unknown): Obj {
  if (!isObj(payload)) throw new ProviderError("bad_response", "Respons provider tidak valid.");
  const code = num(payload.code) ?? (payload.code === -1 ? -1 : null);
  const msg = typeof payload.msg === "string" ? payload.msg : "";
  if (payload.code === 0 && isObj(payload.data)) return payload.data;
  if (/limit/i.test(msg)) throw new ProviderError("rate_limited", "Batas permintaan provider tercapai. Coba lagi beberapa detik lagi.", msg);
  if (/pars|not\s*(found|exist)|invalid|failed|private|removed|unavailable/i.test(msg)) {
    throw new ProviderError("not_found", "Video tidak ditemukan, privat, atau tidak dapat diproses provider.", msg);
  }
  if (payload.code === 0) throw new ProviderError("bad_response", "Respons provider tidak lengkap.");
  throw new ProviderError("upstream", "Provider mengembalikan kesalahan.", `code=${String(code)} msg=${msg}`);
}

export interface TikwmOptions {
  baseUrl?: string;
  name?: string;
  timeoutMs?: number;
  minIntervalMs?: number;
  fetchImpl?: typeof fetch;
  hop?: HopFn;
}

const TIKTOK_SHORT_HOSTS = new Set(["vt.tiktok.com", "vm.tiktok.com"]);

export function createTikwmProvider(opts: TikwmOptions = {}): VideoProvider {
  const base = new URL(opts.baseUrl ?? "https://www.tikwm.com");
  if (base.protocol !== "https:") throw new Error("TIKWM base URL must use https");
  const origin = base.origin;
  const api = (path: string) => `${origin}/api/${path}`;
  const throttle = createThrottle(opts.minIntervalMs ?? 1100);
  const timeoutMs = opts.timeoutMs ?? 10_000;

  const call = (path: string, params: Record<string, string>, method: "GET" | "POST" = "POST") =>
    throttle(async () => {
      const url = method === "GET" ? `${api(path)}?${new URLSearchParams(params).toString()}` : api(path);
      const payload = await providerJson({ url, method, form: method === "POST" ? params : undefined, timeoutMs, fetchImpl: opts.fetchImpl });
      return unwrapTikwm(payload);
    });

  const listResponse = (data: Obj, mode: "keyword" | "creator", query: string) => {
    const rawList = Array.isArray(data.videos) ? data.videos : [];
    const media: Record<string, MediaSources> = {};
    const items: VideoItem[] = [];
    const seen = new Set<string>();
    for (const r of rawList.slice(0, 50)) {
      const n = normalizeTikwmVideo(r, origin);
      if (!n || seen.has(n.video.id)) continue;
      seen.add(n.video.id);
      media[n.video.id] = n.media;
      items.push(n.video);
    }
    const cursor = str(data.cursor);
    const hasMore = data.hasMore === true || data.has_more === true;
    const res: SearchResponse & { media: Record<string, MediaSources> } = {
      mode,
      query,
      items,
      cursor: hasMore ? cursor : null,
      hasMore: hasMore && Boolean(cursor),
      provider: opts.name ?? "tikwm",
      media,
    };
    return res;
  };

  return {
    name: opts.name ?? "tikwm",
    capabilities: { videoDetails: true, comments: true, keywordSearch: true, creatorVideos: true, creatorBio: true },

    async resolveVideoUrl(input) {
      const parsed = parseTikTokInput(input);
      if (!parsed) throw new ProviderError("not_found", "Tautan bukan URL video TikTok yang valid.");
      if (parsed.kind === "video") return { id: parsed.id, url: parsed.url };
      const r = await resolveRedirects(parsed.url, {
        isFollowable: (u) => TIKTOK_SHORT_HOSTS.has(u.hostname.toLowerCase()) || (u.hostname === "www.tiktok.com" && u.pathname.startsWith("/t/")),
        maxRedirects: 4,
        timeoutMs: 5000,
        hop: opts.hop,
      });
      if (r.ok) {
        const finalParsed = parseTikTokInput(r.finalUrl);
        if (finalParsed?.kind === "video") return { id: finalParsed.id, url: finalParsed.url };
        throw new ProviderError("not_found", "Shortlink TikTok tidak mengarah ke video (mungkin kedaluwarsa atau dihapus).");
      }
      // Could not resolve ourselves — let the provider try the short URL directly.
      return { id: null, url: parsed.url };
    },

    async getVideoDetails(urlOrId) {
      const url = isVideoId(urlOrId) ? tiktokVideoUrl(urlOrId, "i") : urlOrId;
      const data = await call("", { url, hd: "1" });
      const n = normalizeTikwmVideo(data, origin);
      if (!n) throw new ProviderError("bad_response", "Data video dari provider tidak lengkap.");
      return { video: { ...n.video, playUrl: n.media.play }, media: n.media };
    },

    async getComments(video, count = 50): Promise<CommentPage> {
      const data = await call("comment/list", { url: tiktokVideoUrl(video.id, video.author.username), count: String(count), cursor: "0" }, "GET");
      const list = Array.isArray(data.comments) ? data.comments : [];
      const comments = list
        .filter(isObj)
        .map((c) => ({
          id: str(c.id) ?? "",
          text: (str(c.text) ?? "").slice(0, 2000),
          authorUsername: isObj(c.user) ? str(c.user.unique_id) : null,
        }))
        .filter((c) => c.text.length > 0)
        .slice(0, 100);
      return { comments, total: num(data.total) };
    },

    async searchVideos(query, cursor, count = 20) {
      const data = await call("feed/search", { keywords: query, count: String(count), cursor: cursor ?? "0", hd: "1" });
      return listResponse(data, "keyword", query);
    },

    async getCreatorVideos(username, cursor, count = 20) {
      const data = await call("user/posts", { unique_id: username, count: String(count), cursor: cursor ?? "0", hd: "1" });
      return listResponse(data, "creator", username);
    },

    async getCreatorBio(username) {
      const data = await call("user/info", { unique_id: username }, "GET");
      const user = isObj(data.user) ? data.user : null;
      const bio = user ? str(user.signature) : null;
      return bio ? bio.slice(0, 1000) : null;
    },

    async ping() {
      try {
        const payload = await providerJson({ url: api(""), method: "GET", timeoutMs: 5000, fetchImpl: opts.fetchImpl });
        return isObj(payload) && "code" in payload;
      } catch {
        return false;
      }
    },
  };
}
