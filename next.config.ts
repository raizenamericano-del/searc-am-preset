import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Media hosts that the provider (TikWM) returns for thumbnails / avatars / video.
 * Kept explicit — no blanket wildcard for every domain.
 */
const MEDIA_HOSTS = [
  "https://*.tiktokcdn.com",
  "https://*.tiktokcdn-us.com",
  "https://*.tiktokcdn-eu.com",
  "https://*.ibyteimg.com",
  "https://www.tikwm.com",
  "https://tikwm.com",
].join(" ");

// Who may embed this app in an iframe. Defaults to same-origin only.
// NOTE: headers are computed at BUILD time — set FRAME_ANCESTORS before `next build`.
const frameAncestors = process.env.FRAME_ANCESTORS?.trim() || "'self'";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${MEDIA_HOSTS}`,
  `media-src 'self' blob: ${MEDIA_HOSTS}`,
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  `frame-ancestors ${frameAncestors}`,
].join("; ");

const nextConfig: NextConfig = {
  // Standalone output is only used by the Dockerfile (NEXT_OUTPUT_STANDALONE=1);
  // plain `npm start` (Railpack/Nixpacks/local) uses the regular .next output.
  output: process.env.NEXT_OUTPUT_STANDALONE === "1" ? "standalone" : undefined,
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        ],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

export default nextConfig;
