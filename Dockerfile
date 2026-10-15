# syntax=docker/dockerfile:1
# Multi-stage build for AM Pencari Preset (Next.js standalone output)

FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Public (non-secret) build-time variables can be passed as build args by Railway.
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_WHATSAPP_URL
ARG NEXT_PUBLIC_TELEGRAM_URL
ARG NEXT_PUBLIC_SAWERIA_URL
ARG NEXT_PUBLIC_TRAKTEER_URL
ARG FRAME_ANCESTORS
ENV NEXT_TELEMETRY_DISABLED=1 \
    NEXT_OUTPUT_STANDALONE=1
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
RUN addgroup -S nodejs -g 1001 && adduser -S nextjs -u 1001 -G nodejs
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
# Railway injects PORT at runtime; server.js reads process.env.PORT / HOSTNAME.
CMD ["node", "server.js"]
