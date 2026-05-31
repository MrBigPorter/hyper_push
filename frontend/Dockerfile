# ==========================================
# HyperPush — Frontend Dockerfile
# ==========================================
# 开发模式 (Vite HMR):
#   docker build --target dev ...
#
# 生产模式 (Nginx 静态文件服务):
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

# ─── 生产阶段 (Nginx 静态文件服务) ───
FROM nginx:1.27-alpine AS production

# 复制构建产物
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx 配置
COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 安全头
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;

    # 静态资源缓存 (Vite 构建带 hash)
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
