# ==========================================
# HyperPush — Frontend Dockerfile
# ==========================================
# 开发模式 (Vite HMR):
#   docker build --target dev ...
#
# 构建静态文件:
#   docker build --target build ...
#
# 生产模式 (Nginx SPA):
#   docker build --target production ...
# ==========================================

# ─── 基础阶段 ───
FROM node:22-alpine AS base

RUN npm install -g bun@1.3.14

WORKDIR /app

# ─── 依赖安装阶段 ───
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ─── 开发阶段 (Vite Dev Server + HMR) ───
FROM deps AS dev
COPY . .
EXPOSE 5173
CMD ["bun", "run", "dev", "--host", "0.0.0.0"]

# ─── 构建阶段 ───
FROM deps AS build
COPY . .
ARG VITE_API_URL=/graphql
ENV VITE_API_URL=${VITE_API_URL}
RUN bun run build

# ─── 生产阶段 (Nginx SPA) ───
FROM nginx:alpine AS production
COPY --from=build /app/dist/app /usr/share/nginx/html
COPY <<'NGINX_EOF' /etc/nginx/conf.d/default.conf
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # SPA client-side routing — fall back to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static assets — long cache (content-hash in filenames)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
NGINX_EOF
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
