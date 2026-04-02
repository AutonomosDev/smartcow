# Dockerfile — smartcow
# Multi-stage: build TypeScript → runtime Node 20 slim
# Ticket: AUT-107
# Puppeteer: uses system Chromium to avoid bundling ~300MB Chrome binary

FROM node:20-slim AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and compile
COPY tsconfig.json ./
COPY src ./src
RUN npx tsc --noEmit && npm run build 2>/dev/null || npx tsc

# ─────────────────────────────────────────────────────
FROM node:20-slim AS runtime

# Chromium for Puppeteer (avoids bundling full Chrome)
RUN apt-get update && apt-get install -y \
    chromium \
    --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production

WORKDIR /app

# Production deps only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output
COPY --from=builder /app/dist ./dist

# Cloud Run requires PORT env var; default 8080
ENV PORT=8080
EXPOSE 8080

# Entrypoint: server.js (to be implemented in a later ticket)
CMD ["node", "dist/server.js"]
