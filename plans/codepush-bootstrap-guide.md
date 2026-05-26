# HyperPush — 项目搭建指南

> 按步骤执行，每一步完成后再进入下一步。

## 前置条件

```bash
# 需要已安装 Node.js 18+ 和 bun
node --version   # 需要 v18+
bun --version    # 需要 v1.x
```

---

## 第 1 步：创建项目目录

```bash
cd /Volumes/MySSD/work
mkdir HyperPush
cd HyperPush
```

---

## 第 2 步：初始化项目

```bash
bun init -y
```

编辑 `package.json`，删除 `"module": "index.ts"` 行，添加 scripts：

```json
{
  "name": "hyperpush",
  "type": "module",
  "private": true,
  "scripts": {
    "build": "nest build",
    "start": "node dist/main",
    "start:dev": "nest build --watch",
    "start:prod": "node dist/main",
    "dev:frontend": "vite",
    "build:frontend": "vite build",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write .",
    "check-types": "tsc --noEmit",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio"
  }
}
```

编辑 `tsconfig.json`，添加 NestJS 所需配置：

```json
{
  "compilerOptions": {
    "lib": ["ESNext"],
    "target": "ESNext",
    "module": "Preserve",
    "moduleDetection": "force",
    "jsx": "react-jsx",
    "allowJs": true,
    "strict": true,
    "skipLibCheck": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noEmit": true,
    "isolatedModules": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@app/*": ["src/app/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules", "dist"]
}
```

---

## 第 3 步：初始化 NestJS CLI 配置

> ⚠️ 使用 **SWC builder** 加速编译（比默认 tsc 快 10x+）

```bash
bun add -D @nestjs/cli @swc/cli @swc/core
```

创建 `nest-cli.json`：

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true,
    "builder": {
      "type": "swc"
    }
  }
}
```

创建 `tsconfig.build.json`（构建时排除前端 SPA）：

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "dist", "test", "**/*spec.ts", "src/app"]
}
```

> `src/app` 是前端 SPA 目录，NestJS 构建时必须排除。

---

## 第 4 步：安装后端依赖

```bash
# NestJS 核心
bun add @nestjs/core @nestjs/common @nestjs/platform-express reflect-metadata rxjs

# GraphQL（code-first 模式）
bun add @nestjs/graphql @nestjs/apollo @apollo/server graphql

# Prisma ORM
bun add @prisma/client
bun add -D prisma

# 认证
bun add @nestjs/jwt @nestjs/passport passport passport-jwt bcryptjs
bun add -D @types/passport-jwt @types/bcryptjs

# 验证
bun add class-validator class-transformer

# 配置 + 环境变量
bun add @nestjs/config dotenv

# 邮件（可选，后续注册验证用）
bun add nodemailer
bun add -D @types/nodemailer
```

---

## 第 5 步：安装前端依赖

```bash
# Vite + React 19
bun add -D vite @vitejs/plugin-react

# React
bun add react react-dom
bun add -D @types/react @types/react-dom

# TanStack Router
bun add @tanstack/react-router @tanstack/router-devtools

# Redux Toolkit + RTK
bun add @reduxjs/toolkit react-redux

# TanStack Query
bun add @tanstack/react-query

# GraphQL 客户端（Apollo Client）
bun add @apollo/client graphql

# i18next
bun add i18next react-i18next

# Tailwind CSS 4（使用 Vite 插件方式，不需要 PostCSS）
bun add tailwindcss @tailwindcss/vite

# Shadcn/ui 前置依赖（等后续手动初始化）
bun add clsx tailwind-merge lucide-react react-hook-form @hookform/resolvers zod recharts
```

> 注意：Tailwind CSS v4 通过 `@tailwindcss/vite` 插件集成到 Vite，**不再需要** PostCSS 配置。
> Shadcn/ui 后续通过 `bunx shadcn@latest init` 初始化。

---

## 第 6 步：配置 Biome

```bash
bun add -D @biomejs/biome
bunx biome init
```

编辑 `biome.json`：

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "organizeImports": { "enabled": true },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "complexity": { "noBannedTypes": "off" }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "always"
    }
  }
}
```

---

## 第 7 步：配置 Tailwind CSS 4

### 7a. Vite 配置

Tailwind v4 使用 `@tailwindcss/vite` 插件，不需要 PostCSS 配置文件。

创建 `vite.config.ts`：

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@app': path.resolve(__dirname, './src/app'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/graphql': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist/app',
    emptyOutDir: true,
  },
});
```

> ⚠️ **代理说明**：NestJS 运行在 `:3000`，Vite 运行在 `:5173`。Vite 将 `/graphql` 和 `/api` 请求代理到 NestJS，开发时无需处理 CORS。

### 7b. 创建 Vite HTML 入口

创建 `index.html`：

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>HyperPush</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/app/main.tsx"></script>
  </body>
</html>
```

### 7c. 创建 CSS 入口文件

创建 `src/app/globals.css`，使用 Tailwind v4 的 `@theme` 指令定义完整的色板系统：

```css
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;

  /* Primary: Blue */
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-300: #93c5fd;
  --color-primary-400: #60a5fa;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  --color-primary-800: #1e40af;
  --color-primary-900: #1e3a8a;
  --color-primary-950: #172554;

  /* Gray / Slate */
  --color-gray-50: #f8fafc;
  --color-gray-100: #f1f5f9;
  --color-gray-200: #e2e8f0;
  --color-gray-300: #cbd5e1;
  --color-gray-400: #94a3b8;
  --color-gray-500: #64748b;
  --color-gray-600: #475569;
  --color-gray-700: #334155;
  --color-gray-800: #1e293b;
  --color-gray-900: #0f172a;
  --color-gray-950: #020617;

  /* Dark background */
  --color-dark-50: #fafafa;
  --color-dark-100: #f4f4f5;
  --color-dark-200: #e4e4e7;
  --color-dark-300: #d4d4d8;
  --color-dark-400: #a1a1aa;
  --color-dark-500: #71717a;
  --color-dark-600: #52525b;
  --color-dark-700: #3f3f46;
  --color-dark-800: #27272a;
  --color-dark-900: #18181b;
  --color-dark-950: #09090b;

  /* Success: Green */
  --color-success-50: #f0fdf4;
  --color-success-500: #22c55e;
  --color-success-600: #16a34a;

  /* Warning: Amber */
  --color-warning-50: #fffbeb;
  --color-warning-500: #f59e0b;
  --color-warning-600: #d97706;

  /* Danger: Red */
  --color-danger-50: #fef2f2;
  --color-danger-500: #ef4444;
  --color-danger-600: #dc2626;
}

body {
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

---

## 第 8 步：项目目录结构

创建完整的项目目录结构：

```bash
mkdir -p src/{auth/dto,auth/models,servers/dto,servers/models,codepush/dto,codepush/models,api-keys/dto,api-keys/models,audit-log/dto,audit-log/models,common/guards,common/decorators,app/{routes,components/ui,store,i18n},prisma}
```

最终目录结构：

```
HyperPush/
├── index.html                    # Vite HTML 入口
├── src/
│   ├── main.ts                   # NestJS 入口
│   ├── app.module.ts             # 根模块（GraphQLModule + 业务模块）
│   ├── prisma/
│   │   ├── prisma.service.ts     # Prisma 客户端服务
│   │   └── prisma.module.ts      # Prisma 模块（全局）
│   ├── auth/                     # 认证模块
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts       # JWT 签发 + bcrypt
│   │   ├── jwt.strategy.ts       # Passport JWT 策略
│   │   ├── auth.resolver.ts      # ← 你手写
│   │   ├── models/               # @ObjectType 定义
│   │   └── dto/                  # @InputType 定义
│   ├── servers/                  # 服务器管理模块
│   │   ├── servers.module.ts     # ← 你手写
│   │   ├── servers.service.ts    # CRUD 业务逻辑
│   │   ├── servers.resolver.ts   # ← 你手写
│   │   ├── models/
│   │   └── dto/
│   ├── codepush/                 # CodePush 代理模块
│   │   ├── codepush.module.ts    # ← 你手写
│   │   ├── codepush.service.ts   # HTTP 代理
│   │   ├── codepush.resolver.ts  # ← 你手写
│   │   └── dto/
│   ├── api-keys/                 # API 密钥模块
│   │   ├── api-keys.module.ts    # ← 你手写
│   │   ├── api-keys.service.ts   # 密钥 CRUD
│   │   ├── api-keys.resolver.ts  # ← 你手写
│   │   └── dto/
│   ├── audit-log/                # 审计日志模块
│   │   ├── audit-log.module.ts   # ← 你手写
│   │   ├── audit-log.service.ts  # 日志查询
│   │   ├── audit-log.resolver.ts # ← 你手写
│   │   └── dto/
│   ├── common/                   # 共享模块
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts # ← 你手写
│   │   └── decorators/
│   │       └── current-user.decorator.ts # ← 你手写
│   └── app/                      # 前端 SPA
│       ├── main.tsx              # React 入口
│       ├── App.tsx               # 根组件
│       ├── globals.css           # Tailwind CSS 入口
│       ├── routes/               # TanStack Router 路由
│       ├── components/           # UI 组件
│       ├── store/                # Redux Toolkit store
│       └── i18n/                 # i18next 配置
├── prisma/
│   └── schema.prisma             # Prisma Schema
├── vite.config.ts
├── postcss.config.js             # 可选（@tailwindcss/vite 不需要）
├── biome.json
├── tsconfig.json
├── tsconfig.build.json
├── nest-cli.json
└── package.json
```

> 注意：`postcss.config.js` 仅在需要使用 PostCSS 其他插件时保留。Tailwind v4 通过 `@tailwindcss/vite` 工作，无需 PostCSS。

---

## 第 9 步：创建核心源文件

### 9a. NestJS 入口 — `src/main.ts`

```ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局前缀（排除 GraphQL playground）
  app.setGlobalPrefix('api', { exclude: ['/graphql'] });

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS
  app.enableCors({
    origin:
      process.env.NODE_ENV === 'production'
        ? false
        : ['http://localhost:5173'],
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 HyperPush running on http://localhost:${port}/graphql`);
}
bootstrap();
```

### 9b. 根模块 — `src/app.module.ts`

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'schema.gql',
      sortSchema: true,
      playground: true,
    }),
    PrismaModule,
    // ← 后续添加 AuthModule, ServersModule 等
  ],
})
export class AppModule {}
```

### 9c. Prisma Service — `src/prisma/prisma.service.ts`

```ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      datasourceUrl: process.env.DATABASE_URL,
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

> ⚠️ Prisma v7 不再支持在 schema 中定义 `url`，必须通过构造函数传入 `datasourceUrl`。

### 9d. Prisma Module — `src/prisma/prisma.module.ts`

```ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

### 9e. Prisma Schema — `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  // Prisma v7: url 必须在 PrismaClient 构造函数传入
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String?
  role      String   @default("admin")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  servers    Server[]
  apiKeys    ApiKey[]
  auditLogs  AuditLog[]
}

model Server {
  id        String   @id @default(cuid())
  name      String
  baseUrl   String
  apiKey    String
  isOnline  Boolean  @default(false)
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model ApiKey {
  id        String    @id @default(cuid())
  name      String
  key       String    @unique
  active    Boolean   @default(true)
  userId    String
  user      User      @relation(fields: [userId], references: [id])
  createdAt DateTime  @default(now())
  expiresAt DateTime?
  lastUsed  DateTime?
}

model AuditLog {
  id        String   @id @default(cuid())
  action    String
  entity    String
  entityId  String?
  detail    String?
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  ip        String?
  createdAt DateTime @default(now())
}
```

### 9f. React 入口 — `src/app/main.tsx`

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from './store/index.js';
import App from './App.js';
import './globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

const rootElement = document.getElementById('root')!;
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>,
);
```

### 9g. Redux Store — `src/app/store/index.ts`

```ts
import { configureStore } from '@reduxjs/toolkit';

export const store = configureStore({
  reducer: {},
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### 9h. 环境变量 — `.env`

```
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="dev-secret-change-in-production"
JWT_EXPIRATION="7d"
PORT=3000
NODE_ENV=development
```

### 9i. 更新 `.gitignore`

```
node_modules/
dist/
prisma/*.db
prisma/*.db-journal
*.local
```

---

## 第 10 步：生成 Prisma 客户端 + 验证构建

```bash
# 生成 Prisma 客户端
bun run db:generate

# 编译后端
bun run build

# 编译前端
bun run build:frontend
```

验证通过后，你应该看到：

```
# Backend
> nest build
> SWC Running...
Successfully compiled: X files with swc (XXms)

# Frontend
> vite build
✓ built in XXms
```

---

## 第 11 步：启动开发环境

```bash
# 终端 1：NestJS BFF（--watch 自动重编译）
bun run start:dev

# 终端 2：前端（Vite HMR）
bun run dev:frontend

# 打开 GraphQL playground
# http://localhost:3000/graphql
```

---

## 第 12 步：手写 GraphQL API 层

参考 [`plans/codepush-graphql-api.md`](plans/codepush-graphql-api.md) 创建以下模块：

1. `common/guards/jwt-auth.guard.ts` + `common/decorators/current-user.decorator.ts`
2. Auth 模块：models, dto, resolver
3. Servers 模块：model, dto, resolver, module
4. Codepush 模块：service（HTTP 代理）, resolver, module
5. ApiKeys 模块：service, resolver, module
6. AuditLog 模块：service, resolver, module
7. 修改 `app.module.ts` 注册所有模块

---

## 参考资料

- [NestJS 文档](https://docs.nestjs.com/)
- [NestJS + GraphQL 指南](https://docs.nestjs.com/graphql/quick-start)
- [Prisma 文档](https://www.prisma.io/docs)
- [TanStack Router 文档](https://tanstack.com/router)
- [Redux Toolkit 文档](https://redux-toolkit.js.org/)
- [Shadcn/ui 文档](https://ui.shadcn.com/)
- [Biome 文档](https://biomejs.dev/)
- [Tailwind CSS v4 文档](https://tailwindcss.com/docs)
