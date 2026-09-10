# ─────────────────────────────────────────
# Thenisai Sweets — Backend Dockerfile
# Node 20 LTS + Express API on port 5003
# ─────────────────────────────────────────
FROM node:20-alpine

# Create a non-root user for security
RUN addgroup -S thenisai && adduser -S thenisai -G thenisai

WORKDIR /app

# Install dependencies first (cache layer)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source
COPY server.js ./

# Ensure data directory exists with correct ownership
RUN mkdir -p /app/data && chown -R thenisai:thenisai /app

USER thenisai

# Port the backend listens on
EXPOSE 5003

# Health check — validates the API is alive
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5003/api/health || exit 1

CMD ["node", "server.js"]
