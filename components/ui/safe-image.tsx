"use client";
import { useState } from "react";
import { ImageOff } from "lucide-react";
import { isAllowedMediaUrl } from "@/lib/utils/media-hosts";
import { cn } from "@/lib/utils/format";

/**
 * Remote thumbnails from the provider CDN. We use a plain <img> on purpose:
 * TikTok CDN URLs are signed and expire quickly, so routing them through the
 * Next.js image optimizer would only add server load and cache dead URLs.
 * Only allow-listed media hosts are rendered; failures show a fallback.
 */
export function SafeImage({ src, alt, className, eager }: { src: string | null; alt: string; className?: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed || !isAllowedMediaUrl(src)) {
    return (
      <div className={cn("flex items-center justify-center bg-gradient-to-br from-bg-raised to-bg-soft text-ink-dim", className)} role="img" aria-label={`${alt} (gambar tidak tersedia)`}>
        <ImageOff className="h-6 w-6" aria-hidden />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={cn("object-cover", className)}
    />
  );
}
