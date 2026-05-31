# ==========================================
# HyperPush — Frontend Dockerfile
# ==========================================
# 前端已部署到 Cloudflare Pages，此 Dockerfile 仅用于本地开发。
#
# 开发模式 (Vite HMR):
#   docker build --target dev ...
#
# 构建模式 (生成静态文件):
#   docker build --target build ...
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
