# ==========================================
# HyperPush Backend — Production Dockerfile
# ==========================================
# 多阶段构建：Builder → Production
# ==========================================

# -----------------------------------------
# Stage 1: Builder
# -----------------------------------------
FROM node:22-alpine AS builder

RUN npm install -g bun@1.3.14

WORKDIR /app

COPY package.json bun.lock ./
COPY prisma/schema.prisma ./prisma/

RUN bun install --frozen-lockfile

COPY . .

RUN bunx prisma generate
RUN bun run build

# -----------------------------------------
# Stage 2: Development (热更新)
# -----------------------------------------
FROM node:22-alpine AS development

RUN apk add --no-cache openssl wget ca-certificates tzdata
RUN npm install -g bun@1.3.14

WORKDIR /app

ENV TZ=Asia/Shanghai
ENV NODE_ENV=development

COPY package.json bun.lock ./
COPY prisma/schema.prisma ./prisma/
RUN bun install --frozen-lockfile
RUN bunx prisma generate

# 复制 NestJS 配置文件（tsconfig.json, nest-cli.json 等）
# src/ 由 volume 挂载实现热更新
COPY tsconfig.json tsconfig.build.json nest-cli.json ./

EXPOSE 3000

# NestJS watch mode — src/ 文件变化自动重启
CMD ["bun", "run", "start:dev"]

# -----------------------------------------
# Stage 3: Production
# -----------------------------------------
FROM node:22-alpine AS production

RUN apk add --no-cache openssl wget ca-certificates tzdata
RUN npm install -g bun@1.3.14

WORKDIR /app

ENV TZ=Asia/Shanghai
ENV NODE_ENV=production

COPY --from=builder /app/dist           ./dist
COPY --from=builder /app/node_modules   ./node_modules
COPY --from=builder /app/package.json   ./
COPY --from=builder /app/prisma         ./prisma
COPY --from=builder /app/prisma.config.ts ./

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/graphql >/dev/null 2>&1 || exit 1

CMD ["bun", "dist/main.js"]
