# ==========================================
# HyperPush — Frontend Dev Dockerfile
# ==========================================
# 在 Docker 中运行 Vite 开发服务器，支持 HMR 热更新
# Build context: ./frontend (由 compose.yml 设定)
# ==========================================

FROM node:22-alpine

# 安装 bun（比 npm 快 10x）
RUN npm install -g bun@1.3.14

WORKDIR /app

# ---- 先拷贝依赖声明 (利用 Docker layer 缓存) ----
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ---- 拷贝源码 ----
COPY . .

EXPOSE 5173

# Vite 开发服务器
# --host 0.0.0.0: 允许容器内监听所有网络接口
# VITE_PROXY_TARGET: 在 compose.yml 中设为 http://app:3000
CMD ["bun", "run", "dev", "--host", "0.0.0.0"]
