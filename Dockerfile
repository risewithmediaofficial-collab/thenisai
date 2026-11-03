# Stage 1: Build React app
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build arguments for version tracking
ARG BUILD_COMMIT=unknown
ARG BUILD_TIME=unknown

COPY package*.json ./
RUN npm ci

COPY . .

# Embed version metadata into public/version.json before building
RUN echo "{\"version\":\"1.0.2\",\"commit\":\"${BUILD_COMMIT}\",\"buildTime\":\"${BUILD_TIME}\"}" > public/version.json

RUN npm run build

# Stage 2: Serve with nginx + proxy /api to backend
FROM nginx:alpine

# Copy built React app
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config (includes /api proxy to backend container)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
