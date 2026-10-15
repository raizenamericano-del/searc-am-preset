"use client";
import { Modal } from "@/components/ui/modal";
import { useAppUi } from "@/components/providers/app-ui";
import { ErrorState } from "@/components/ui/states";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiClientError, apiPost } from "@/lib/client/api";
import type { VideoItem } from "@/types";
import { useEffect, useState } from "react";
import { VideoDetail } from "./video-detail";

/** Opens a list item: fetches the full detail (play URL, media flags) then renders the detail view. */
export default function VideoDetailModal() {
  const { video, closeVideo } = useAppUi();
  const [full, setFull] = useState<{ id: string; video: VideoItem } | null>(null);
  const [error, setError] = useState<{ id: string; err: ApiClientError } | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!video) return;
    const controller = new AbortController();
    apiPost<{ video: VideoItem }>("/api/video", { input: video.url }, controller.signal)
      .then((r) => setFull({ id: video.id, video: r.video }))
      .catch((e: unknown) => {
        if (e instanceof ApiClientError && e.code === "ABORTED") return;
        setError({ id: video.id, err: e instanceof ApiClientError ? e : new ApiClientError("INTERNAL", "Gagal memuat detail.") });
      });
    return () => controller.abort();
  }, [video, nonce]);

  const current = video && full?.id === video.id ? full.video : null;
  const err = video && error?.id === video.id ? error.err : null;

  return (
    <Modal open={Boolean(video)} onClose={closeVideo} title="Detail Video" description={video ? `@${video.author.username}` : undefined} size="xl">
      {video &&
        (current ? (
          <VideoDetail video={current} />
        ) : err ? (
          <ErrorState
            message={err.message}
            hint={err.hint}
            onRetry={() => {
              setError(null);
              setNonce((n) => n + 1);
            }}
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-[280px_1fr]" aria-busy="true">
            <Skeleton className="mx-auto aspect-[9/16] w-full max-w-[280px] rounded-xl" />
            <div className="space-y-3">
              <p className="text-sm text-ink-muted">Mengambil metadata video…</p>
              <Skeleton className="h-10 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        ))}
    </Modal>
  );
}
