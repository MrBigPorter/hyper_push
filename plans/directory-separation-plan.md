# 目录分离计划：后端 (`backend/`) + 前端 (`frontend/`)

## 当前问题

现有代码混在同一个 `src/` 目录：

```
src/              ← Backend + Frontend 混杂
├── main.ts       Backend
├── app.module.ts Backend
├── auth/         Backend
├── servers/      Backend
├── codepush/     Backend
├── api-keys/     Backend
├── audit-log/    Backend
├── prisma/       Backend
├── app/          ← Frontend (React)
├── components/   ← Frontend (shadcn UI)
└── lib/          ← Frontend (utils)
```

## 目标结构

```
hyperpush/
├── backend/                         # 🟢 后端 (NestJS + Prisma)
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── app.resolver.ts
│   │   ├── auth/
│   │   ├── servers/
│   │   ├── codepush/                # 新代理模块
│   │   ├── api-keys/
│   │   ├── audit-log/
│   │   └── prisma/                  # PrismaService
│   ├── prisma/
│   │   └── schema.prisma
│   ├── package.json                 # NestJS + GraphQL 依赖
│   ├── tsconfig.json
│   ├── tsconfig.build.json
│   ├── nest-cli.json
│   ├── .env.example
│   └── Dockerfile
├── frontend/                        # 🔵 前端 (React + Vite)
│   ├── src/
│   │   ├── app/                     # 原 src/app/
│   │   ├── components/              # 原 src/components/ (shadcn)
│   │   └── lib/                     # 原 src/lib/
│   ├── index.html
│   ├── package.json                 # React + Vite 依赖
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── Dockerfile
├── compose.yml                      # Docker Compose (更新路径)
├── compose.codepush.yml             # 不变
├── .gitignore
├── .github/                         # CI/CD 更新路径
├── README.md
└── plans/                           # 规划文档
```

## 文件变更清单（详细）

### 1. 创建 `backend/` 目录并移动文件

| 操作 | 源路径 | 目标路径 |
|------|--------|---------|
| MOVE | `src/main.ts` | `backend/src/main.ts` |
| MOVE | `src/app.module.ts` | `backend/src/app.module.ts` |
| MOVE | `src/app.resolver.ts` | `backend/src/app.resolver.ts` |
| MOVE | `src/prisma/` | `backend/src/prisma/` |
| MOVE | `src/auth/` | `backend/src/auth/` |
| MOVE | `src/servers/` | `backend/src/servers/` |
| MOVE | `src/codepush/` | `backend/src/codepush/` |
| MOVE | `src/api-keys/` | `backend/src/api-keys/` |
| MOVE | `src/audit-log/` | `backend/src/audit-log/` |
| MOVE | `prisma/schema.prisma` | `backend/prisma/schema.prisma` |
| MOVE | `prisma.config.ts` | `backend/prisma.config.ts` |
| MOVE | `nest-cli.json` | `backend/nest-cli.json` |
| MOVE | `tsconfig.json` | `backend/tsconfig.json` |
| MOVE | `tsconfig.build.json` | `backend/tsconfig.build.json` |
| CREATE | `backend/.env.example` | 从根目录 `.env.example` 复制 |
| CREATE | `backend/package.json` | NestJS 专属依赖 |
| CREATE | `backend/Dockerfile` | 从根 `Dockerfile` 精简 |

### 2. 创建 `frontend/` 目录并移动文件

| 操作 | 源路径 | 目标路径 |
|------|--------|---------|
| MOVE | `src/app/` | `frontend/src/app/` |
| MOVE | `src/components/` | `frontend/src/components/` |
| MOVE | `src/lib/` | `frontend/src/lib/` |
| MOVE | `index.html` | `frontend/index.html` |
| MOVE | `vite.config.ts` | `frontend/vite.config.ts` |
| MOVE | `components.json` | `frontend/components.json` |
| CREATE | `frontend/package.json` | React + Vite 专属依赖 |
| CREATE | `frontend/tsconfig.json` | Frontend 专用 tsconfig |
| CREATE | `frontend/Dockerfile` | 从 `Dockerfile.frontend` 精简 |

### 3. 需要修改的文件

| 文件 | 变更 |
|------|------|
| `backend/package.json` | 移除所有 `@types/react`, `react`, `vite`, `tailwindcss`, `@vitejs/plugin-react` 等前端依赖。添加 `backend-` 前缀脚本 |
| `backend/tsconfig.json` | 移除 `jsx: "react-jsx"`，移除 DOM lib 引用，调整 `paths` |
| `backend/tsconfig.build.json` | 移除 `exclude: ["src/app"]`（不再需要） |
| `backend/nest-cli.json` | `sourceRoot` 不变 (`src`)，路径已是相对的 |
| `backend/Dockerfile` | 移除 Vite 前端构建阶段，只构建 NestJS |
| `frontend/package.json` | 只包含 React + Vite + shadcn 依赖 |
| `frontend/vite.config.ts` | 调整 `@` 别名的 `__dirname` 路径 |
| `frontend/tsconfig.json` | 移除 NestJS/decorator 配置 |
| `compose.yml` | 更新 `context` 和 `dockerfile` 路径，`volumes` 路径 |
| `.gitignore` | 添加 `backend/dist/`, `backend/prisma/*.db`, `frontend/dist/` |
| `.github/workflows/*` | 更新所有 CI/CD 路径（如果有） |
| `README.md` | 更新路径说明 |

### 4. 根目录文件处理

| 文件 | 操作 |
|------|------|
| `.env` | 留在根目录（Docker 自动读取）或移动到 `backend/.env` |
| `.dockerignore` | 更新路径 |
| `biome.json` | 留在根目录（路径配置更新） |
| `bun.lock` | 删除，每个子项目有独立的 `bun.lock` |
| `Dockerfile` | 移动到 `backend/Dockerfile` 并精简 |
| `Dockerfile.frontend` | 移动到 `frontend/Dockerfile` 并精简 |

## 实施顺序（Step by Step）

```
Step 1: 创建 backend/ 目录结构 + 移动后端文件
Step 2: 创建 frontend/ 目录结构 + 移动前端文件
Step 3: 创建 backend/package.json（精简 NestJS 依赖）
Step 4: 创建 frontend/package.json（精简 React 依赖）
Step 5: 创建 backend/tsconfig.json + tsconfig.build.json
Step 6: 创建 frontend/tsconfig.json
Step 7: 创建 backend/Dockerfile（移除前端构建）
Step 8: 创建 frontend/Dockerfile（纯前端容器）
Step 9: 更新 compose.yml（路径映射）
Step 10: 更新 .gitignore
Step 11: 安装依赖 + 验证构建
Step 12: 更新 CI/CD + 文档
```

## 关键注意事项

### ⚠️ Vite `@` 别名路径变更

当前 `vite.config.ts`：
```ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),          // → /hyperpush/src
    '@app': path.resolve(__dirname, './src/app'),   // → /hyperpush/src/app
  },
}
```

移动后 `frontend/vite.config.ts`：
```ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),          // → /hyperpush/frontend/src
    '@app': path.resolve(__dirname, './src/app'),   // → /hyperpush/frontend/src/app
  },
}
```

**⚠️ 前端所有 `@/` 导入路径不变！** 因为 `@` 仍然映射到 `./src`，只是现在 `./src` 在 `frontend/` 下了。

### ⚠️ 前端组件导入路径

当前前端代码中 `@/components/ui/button` → 映射到 `src/components/ui/button`
移动后 → `frontend/src/components/ui/button`（`@` 映射不变，路径不变）

**无需修改前端代码的导入路径。**

### ⚠️ 后端导入路径

后端代码使用相对路径 `../` 和 `./`，移动后目录层级一致，路径不变。

**无需修改后端代码的导入路径。**

### ⚠️ Prisma 相关

- `prisma generate` 需要在 `backend/` 目录下执行
- `prisma db push` 需要在 `backend/` 目录下执行
- `prisma/schema.prisma` 移动到 `backend/prisma/schema.prisma`
- `prisma.config.ts` 移动到 `backend/prisma.config.ts`

### ⚠️ Docker Compose 变更

当前 `compose.yml`：
```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      - ./src:/app/src
      - ./prisma:/app/prisma
      - ./package.json:/app/package.json

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    volumes:
      - ./src:/app/src
      - ./index.html:/app/index.html
      - ./vite.config.ts:/app/vite.config.ts
      - ./package.json:/app/package.json
```

变更后：
```yaml
services:
  app:
    build:
      context: ./backend
      dockerfile: Dockerfile
    volumes:
      - ./backend/src:/app/src
      - ./backend/prisma:/app/prisma
      - ./backend/package.json:/app/package.json

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    volumes:
      - ./frontend/src:/app/src
      - ./frontend/index.html:/app/index.html
      - ./frontend/vite.config.ts:/app/vite.config.ts
      - ./frontend/package.json:/app/package.json
```

### ⚠️ .gitignore 更新

```gitignore
# Backend
backend/dist/
backend/prisma/*.db

# Frontend
frontend/dist/

# Root (keep)
node_modules
.env
```

## 依赖拆分（package.json）

### backend/package.json 包含

```
@nestjs/common, @nestjs/core, @nestjs/graphql, @nestjs/apollo
@nestjs/config, @nestjs/jwt, @nestjs/passport, @nestjs/platform-express
@prisma/client, @prisma/adapter-libsql
graphql, graphql-type-json, reflect-metadata, rxjs
passport, passport-jwt, bcryptjs, nodemailer
class-transformer, class-validator
prisma (dev)
@nestjs/cli, @swc/cli, @swc/core (dev)
@types/bcryptjs, @types/bun, @types/multer, @types/nodemailer, @types/passport-jwt (dev)
typescript (peer)
```

### frontend/package.json 包含

```
react, react-dom
@apollo/client, @tanstack/react-query, @tanstack/react-router
@reduxjs/toolkit, react-redux
vite, @vitejs/plugin-react
tailwindcss, @tailwindcss/vite
i18next, react-i18next
lucide-react, recharts
react-hook-form, @hookform/resolvers, zod
@base-ui/react, class-variance-authority, clsx, tailwind-merge
@fontsource-variable/geist
@types/react, @types/react-dom (dev)
typescript (dev)
```
