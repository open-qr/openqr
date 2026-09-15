# syntax=docker/dockerfile:1

# OpenQR — Next.js (standalone output) production image
# Multi-stage build: install deps -> build -> minimal non-root runtime.

ARG NODE_VERSION=22-alpine

################################################################################
# Base: pinned Node + pnpm (via corepack, version locked to package.json)
################################################################################
FROM node:${NODE_VERSION} AS base
RUN corepack enable && corepack prepare pnpm@10.16.1 --activate
WORKDIR /app

################################################################################
# Deps: install dependencies with a frozen lockfile (cached layer)
################################################################################
FROM base AS deps
# patches/ must be present for install: package.json declares qr-code-styling
# as a pnpm patchedDependency and pnpm reads the patch file before resolving.
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

################################################################################
# Builder: compile the Next.js app in standalone mode
################################################################################
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

################################################################################
# Runner: minimal, non-root, read-only-friendly production image
################################################################################
FROM node:${NODE_VERSION} AS runner

LABEL org.opencontainers.image.title="OpenQR" \
      org.opencontainers.image.description="Free, open-source, watermark-free QR code generator. Runs entirely in your browser." \
      org.opencontainers.image.licenses="AGPL-3.0-only" \
      org.opencontainers.image.source="https://github.com/open-qr/openqr"

# tini reaps zombies and forwards signals correctly to `node` as PID 1,
# so `docker stop` / SIGTERM shut the server down cleanly.
RUN apk add --no-cache tini

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Dedicated, unprivileged, non-login user (no shell, no home dir writes needed).
RUN addgroup -g 1001 -S nodejs \
 && adduser -S nextjs -u 1001 -G nodejs

# next/image's default loader caches optimized images on disk; pre-create the
# cache dir with the right ownership so the app works even under `--read-only`
# with a tmpfs mounted at /app/.next/cache.
RUN mkdir -p .next/cache/images && chown -R nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# AGPL hygiene: the licence and third-party notices travel inside the image.
COPY --from=builder --chown=nextjs:nodejs /app/LICENSE /app/NOTICE ./

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- "http://127.0.0.1:${PORT}/" > /dev/null 2>&1 || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
