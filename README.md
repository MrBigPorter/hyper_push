<div align="center">

# 🚀 HyperPush — CodePush Universal Management Console

**Production-grade full-stack CodePush management platform** — Unified console for managing multiple code-push-server instances, apps, deployments, and releases across teams.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)](https://vitejs.dev/)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs)](https://nestjs.com/)
[![GraphQL](https://img.shields.io/badge/GraphQL-16-E10098?logo=graphql)](https://graphql.org/)
[![Apollo](https://img.shields.io/badge/Apollo-5-311C87?logo=apollographql)](https://www.apollographql.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn/ui-latest-black)](https://ui.shadcn.com/)
[![TanStack Router](https://img.shields.io/badge/TanStack_Router-latest-FF4154?logo=reactrouter)](https://tanstack.com/router)
[![Redux](https://img.shields.io/badge/Redux_Toolkit-2-764ABC?logo=redux)](https://redux-toolkit.js.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker)](https://www.docker.com/)
[![AWS](https://img.shields.io/badge/AWS_CDK-FF9900?logo=amazonaws)](https://aws.amazon.com/cdk/)
[![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?logo=githubactions)](https://github.com/features/actions)
[![Bun](https://img.shields.io/badge/Bun-1.3-000000?logo=bun)](https://bun.sh/)
[![Nginx](https://img.shields.io/badge/Nginx-009639?logo=nginx)](https://nginx.org/)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Technical Challenges & Solutions](#-technical-challenges--solutions)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Available Commands](#-available-commands)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Interview Talking Points](#-interview-talking-points)
- [My Role](#-my-role)

---

## ✨ Overview

HyperPush is a **CodePush universal management console** that solves a critical gap in the React Native ecosystem: **there is no official CodePush management UI**. The popular `lisong/code-push-server` (v5.7.1) provides only a REST API — no dashboard, no multi-server management, no team collaboration features.

HyperPush wraps one or more code-push-server instances behind a **modern BFF (Backend-for-Frontend) architecture**, providing a full-featured admin console with:

- GraphQL API (Apollo 5, code-first) for flexible frontend queries
- Multi-server CodePush instance management from a single pane
- JWT-scoped per-server authentication with API key management
- Audit logging for all CodePush operations
- Dual CI/CD pipeline (VPS Docker Compose + AWS ECS via CDK)

**What makes this project stand out:**

- **Multi-server CodePush proxy** — Manage N code-push-server instances through one unified BFF, with scoped JWT tokens per server
- **Code-first GraphQL** — NestJS 11 Apollo Server 5 with auto-generated TypeScript types from GraphQL schema
- **Three-layer state management** — Redux Toolkit (UI/auth) + Apollo Client (GraphQL cache) + TanStack Query (server state) with clear separation of concerns
- **Dual deployment target** — Same codebase deploys to VPS (Docker Compose) AND AWS ECS (CDK) via separate workflows
- **Multi-stage Docker builds** — Frontend: 5 stages (base → deps → dev → build → production/Nginx), Backend: 3 stages (builder → development → production)
- **Nginx reverse proxy** — Container-based reverse proxy with hot reload, proxying to 4 internal services

---

## 🧠 Technical Challenges & Solutions

> _The following are real technical problems I encountered and solved while building this project. Each includes the problem, my approach, and the key implementation details._

---

### 1. CodePush Proxy Authentication — JWT Header Injection

**Problem:** [`lisong/code-push-server`](https://github.com/lisong/code-push-server) expects a JWT `Authorization: Bearer <token>` header for every API call. However, HyperPush is a multi-server management console — each server has its own JWT credentials. The BFF needs to authenticate the user once (via GraphQL), then transparently inject the correct per-server JWT into proxied REST requests. This is not a standard reverse proxy pattern.

**Solution:** A dedicated [`CodepushService`](backend/src/codepush/codepush.service.ts:18) that manages per-server JWT tokens and injects them into all proxied requests:

```typescript
// Each request fetches the server's stored API key as the JWT
private async getServerAuth(serverId: string): Promise<{ baseUrl: string; token: string }> {
  const server = await this.prisma.server.findUnique({ where: { id: serverId } });
  if (!server) throw new NotFoundException(`Server ${serverId} not found`);
  return { baseUrl: CODEPUSH_BASE_URL, token: server.apiKey };
}

// Every proxied request gets the Bearer token injected automatically
private async fetchWithAuth(serverId: string, method: string, path: string) {
  const { baseUrl, token } = await this.getServerAuth(serverId);
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  // ... forward the request with injected auth
}
```

**Key details:**

- Tokens are stored in the `Server.apiKey` field in the database — set once when adding a server
- A separate [`CodepushController`](backend/src/codepush/codepush.controller.ts:30) handles multipart release uploads (GraphQL can't handle file uploads natively)
- The controller forwards `FormData` with the zip bundle and metadata to code-push-server's release endpoint
- All errors are parsed and normalized — code-push-server returns both JSON and plain-text error responses

**Files:** [`codepush.service.ts`](backend/src/codepush/codepush.service.ts:18) · [`codepush.controller.ts`](backend/src/codepush/codepush.controller.ts:30) · [`codepush.module.ts`](backend/src/codepush/codepush.module.ts)

---

### 2. Dual CI/CD Pipeline — VPS Docker Compose + AWS ECS

**Problem:** The project targets two deployment environments: a primary VPS running Docker Compose (for cost efficiency and rapid iteration) and AWS ECS via CDK (for production scalability). Each has a completely different orchestration model — Docker Compose uses `compose.yml` with multi-stage builds, while AWS ECS uses task definitions with load balancers. Maintaining both without duplicating build logic was the challenge.

**Solution:** Two independent GitHub Actions workflows sharing the same Docker build artifacts:

```yaml
# Both workflows reference the same built images
env:
  IMAGE_NAME_APP: ghcr.io/${{ github.repository_owner }}/hyperpush-app
  IMAGE_NAME_FRONTEND: ghcr.io/${{ github.repository_owner }}/hyperpush-frontend
```

```
VPS Pipeline (deploy-vps.yml)           AWS Pipeline (deploy.yml)
┌────────────────────────────────┐      ┌────────────────────────────────┐
│ 1. Build + Push Docker images  │      │ 1. Build + Push Docker images  │
│ 2. Setup SSH key & known_hosts │      │ 2. CDK synth + deploy          │
│ 3. Verify SSH authentication   │      │ 3. Deploy to ECS Fargate       │
│ 4. tar → scp → ssh extract     │      │    (RDS + Redis + ALB)         │
│ 5. docker compose up -d        │      │                                │
└────────────────────────────────┘      └────────────────────────────────┘
```

**Key details:**

- The VPS workflow uses a **progressive diagnostic pipeline** — port check → key setup → auth test → file sync — so failures are caught early with actionable error messages
- The AWS workflow uses AWS CDK (`infra/`) to define the entire ECS infrastructure as code
- Both workflows push to the same GHCR registry, so images are built once
- The AWS stack includes: VPC, ECS cluster, Fargate services, Application Load Balancer, RDS (PostgreSQL), ElastiCache (Redis)

**Files:** [`deploy-vps.yml`](.github/workflows/deploy-vps.yml) · [`deploy.yml`](.github/workflows/deploy.yml) · [`hyperpush-stack.ts`](infra/lib/hyperpush-stack.ts)

---

### 3. SSH Authentication in GitHub Actions — Escaping the appleboy/scp-action Trap

**Problem:** The original pipeline used [`appleboy/scp-action@v0.1.7`](https://github.com/appleboy/scp-action) to transfer files to the VPS. Under the hood, this action uses `drone-scp` v1.6.14 — a Go-based SCP client. It failed with:

```
ssh: handshake failed: ssh: unable to authenticate, attempted methods [none publickey], no supported methods remain
```

This is a known compatibility issue between drone-scp's SSH library and OpenSSH's ED25519 key format. The action provided no diagnostic information and zero control over the authentication flow.

**Solution:** Replaced the opaque third-party action with a transparent **native SSH pipeline** using `tar + scp + ssh` with progressive diagnostics:

```yaml
# Step 1: Write SSH key with validation
echo "$SSH_KEY" > "$HOME/.ssh/hyperpush-deploy"
chmod 600 "$HOME/.ssh/hyperpush-deploy"
ssh-keyscan -T 10 -p "$SSH_PORT" "$SSH_HOST" >> "$HOME/.ssh/known_hosts"

# Step 2: Verify auth BEFORE attempting file transfer
ssh -o BatchMode=yes -o ConnectTimeout=10 \
  -i "$HOME/.ssh/hyperpush-deploy" -p "$SSH_PORT" \
  "${SSH_USER}@${SSH_HOST}" "echo 'SSH_AUTH_OK'"

# Step 3: tar + scp + ssh extract (one network round-trip)
tar czf /tmp/deploy.tar.gz compose.yml compose.codepush.yml deploy/
scp -i "$HOME/.ssh/hyperpush-deploy" -P "$SSH_PORT" -C \
  /tmp/deploy.tar.gz "${SSH_USER}@${SSH_HOST}:/tmp/deploy.tar.gz"
ssh -i "$HOME/.ssh/hyperpush-deploy" -p "$SSH_PORT" "${SSH_USER}@${SSH_HOST}" \
  "cd /opt/hyperpush && tar xzf /tmp/deploy.tar.gz && rm -f /tmp/deploy.tar.gz"
```

**Key details:**

- Every step has actionable error messages — if SSH auth fails, the pipeline prints exact `ssh-copy-id` commands and `sshd_config` checks
- Key validation prevents silent failures: checks for `-----BEGIN OPENSSH PRIVATE KEY-----` header
- `tar + scp + ssh` is more reliable than `rsync` in CI environments (no daemon dependency)
- The SSH key is masked via `::add-mask::$SSH_KEY` to prevent secret leakage in logs

**Files:** [`deploy-vps.yml`](.github/workflows/deploy-vps.yml:196) _(lines 196–345)_

---

### 4. BFF Architecture with Apollo Code-First GraphQL

**Problem:** The frontend needs a flexible API that can evolve rapidly — GraphQL is the clear choice. However, code-push-server is a REST API, and many backend operations (release upload, deployment management) are inherently imperative. The architecture needed to balance GraphQL's query flexibility with REST's operational simplicity.

**Solution:** NestJS serves as a **BFF (Backend-for-Frontend)** that exposes both GraphQL and REST surfaces:

```
┌─────────────┐     GraphQL (Apollo 5)     ┌──────────────────┐
│   Frontend   │ ──────────────────────────▶│   NestJS BFF     │
│  (React 19)  │                           │  code-first GQL  │
│              │     REST (multipart)       │  JWT auth (BCrypt)│
│              │ ──────────────────────────▶│  Audit logging   │
└─────────────┘                            └────────┬─────────┘
                                                    │
                                          REST proxy (JWT injected)
                                                    │
                                                    ▼
                                          ┌──────────────────┐
                                          │ code-push-server │
                                          │  Node.js REST API │
                                          └──────────────────┘
```

**Key details:**

- **Code-first** — GraphQL schema is generated from NestJS decorators (`@ObjectType`, `@Resolver`, `@Query`), avoiding SDL-first sync issues
- **Apollo Server 5** with the `@nestjs/apollo` driver — integrated directly into the NestJS module system
- **JWT guard** — A custom `GqlAuthGuard` wraps all GraphQL resolvers, using `@nestjs/passport` + `passport-jwt`
- **Separate REST controller** for file uploads — GraphQL can't handle `multipart/form-data`, so the release upload endpoint is REST-only
- **Automatic type generation** — Frontend generates TypeScript types from the GraphQL schema via Apollo Codegen

**Files:** [`app.module.ts`](backend/src/app.module.ts) · [`auth.module.ts`](backend/src/auth/auth.module.ts) · [`codepush.controller.ts`](backend/src/codepush/codepush.controller.ts)

---

### 5. Three-Layer State Management — Separating Concerns

**Problem:** A modern React SPA has three distinct state domains: global UI state (theme, sidebar), GraphQL cache (Apollo), and server-fetched data (REST). Using a single tool for all three leads to either over-engineering (putting everything in Redux) or query confusion (TanStack Query + Apollo cache overlapping). The challenge was defining clear boundaries.

**Solution:** Three-layer architecture with explicit responsibility separation:

```
┌─────────────────────────────────────────────────────────────┐
│                    State Management Layers                   │
├─────────────────────────────────────────────────────────────┤
│ Layer 1: Redux Toolkit                                       │
│   Scope: Global UI state, auth tokens, theme, sidebar        │
│   Files: authSlice.ts, themeSlice.ts                        │
│   Note: Only for truly global, cross-component state         │
├─────────────────────────────────────────────────────────────┤
│ Layer 2: Apollo Client (InMemoryCache)                       │
│   Scope: All GraphQL query results, normalized cache         │
│   Files: apollo.ts, graphql.ts                               │
│   Note: Deduplicates GQL requests, merges identical types    │
├─────────────────────────────────────────────────────────────┤
│ Layer 3: TanStack React Query                                │
│   Scope: Server state from REST endpoints, mutations         │
│   Files: (via hooks, e.g., useAppStore.ts)                   │
│   Note: staleTime: 30s as default, auto refetch on focus    │
└─────────────────────────────────────────────────────────────┘
```

**Key details:**

- **Redux** handles only 2 slices: `auth` (user session, JWT token) and `theme` (dark/light mode, sidebar collapsed state)
- **Apollo Client** manages the GraphQL normalized cache — queries are automatically deduplicated and merged
- **TanStack Query** handles REST calls to the CodePush proxy (release history, deployment stats)
- The three layers never overlap — if data comes from GraphQL, it lives in Apollo. If from REST, it lives in TanStack Query. If it's pure UI state, it's in Redux.

**Files:** [`store/index.ts`](frontend/src/app/store/index.ts) · [`authSlice.ts`](frontend/src/app/store/slices/authSlice.ts) · [`themeSlice.ts`](frontend/src/app/store/slices/themeSlice.ts) · [`apollo.ts`](frontend/src/app/lib/apollo.ts)

---

### 6. Multi-Stage Docker Build Optimization

**Problem:** The frontend Dockerfile has 5 stages (`base → deps → dev → build → production`). Without careful layer ordering, any code change invalidates the entire `node_modules` layer, causing 2+ minute rebuilds. The backend has 3 stages with a similar problem.

**Solution:** Strategic `COPY` ordering and stage targeting:

```dockerfile
# Frontend: layers ordered by rate of change (slowest → fastest)
FROM node:22-alpine AS base
RUN npm install -g bun@1.3.14
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock ./    # ← Rarely changes → cached layer
RUN bun install --frozen-lockfile  # ← Cached unless lock file changes

FROM deps AS dev
COPY . .                          # ← Everything below invalidates often
EXPOSE 5173
CMD ["bun", "run", "dev", "--host", "0.0.0.0"]

FROM deps AS build
COPY . .
ARG VITE_API_URL=/graphql
ENV VITE_API_URL=${VITE_API_URL}
RUN bun run build

FROM nginx:1.27-alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
EOF
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Key details:**

- **`COPY package.json bun.lock` first** — these change far less frequently than source code, keeping the `RUN bun install` layer cached
- **`deps` is the shared base** — both `dev` and `build` stages inherit from `deps`, so `bun install` runs once
- **Production stage uses `nginx:1.27-alpine`** — tiny image (~23MB) serving static files, no Node.js runtime
- **Backend similar pattern**: `builder` stage → `development` (hot reload) → `production` (compiled JS)

**Files:** [`frontend/Dockerfile`](frontend/Dockerfile) · [`backend/Dockerfile`](backend/Dockerfile)

---

### 7. Nginx Reverse Proxy — Container-Based with Hot Reload

**Problem:** The production stack serves 4 services (frontend SPA, backend GraphQL API, code-push-server REST API, and static assets). Each needs proper routing, static asset caching, and large upload support. Caddy 2 was initially used but its auto-https (Let's Encrypt) caused reliability issues.

**Solution:** Nginx (`nginx:alpine`) running inside Docker, configured via a single mounted config file. Config is hot-reloaded via `docker exec nginx -t && docker exec nginx -s reload` — following the same pattern as [JoyMini's production deployment](https://github.com/Porter-Sz/JoyMini_Nest_Monorepo).

```nginx
# Console domain — admin UI + GraphQL API
server {
    listen 80;
    server_name console.hyperpush.org;

    location /graphql {
        proxy_pass http://hyperpush-app:3000;
    }

    location / {
        proxy_pass http://hyperpush-frontend:80;
    }
}

# CodePush domain — code-push-server
server {
    listen 80;
    server_name cp.hyperpush.org;
    client_max_body_size 500M;

    location / {
        proxy_pass http://hyperpush-codepush-prod:3000;
    }
}
```

**Key details:**

- **Two server blocks, one Nginx container** — `console.*` for the admin UI + GraphQL, `cp.*` for the CodePush server
- **Path-based routing** — `/graphql` and `/api/*` go to the backend, everything else goes to the frontend SPA
- **Docker DNS resolver** — `resolver 127.0.0.11 valid=10s` prevents 502 errors after container recreation
- **Hot reload** — Config synced via `appleboy/scp-action`, then reloaded with `nginx -s reload` (no restart)
- **Large uploads** — `client_max_body_size 500M` for CodePush release file uploads
- **Static asset caching** — Frontend assets (JS/CSS/images) cached with `expires 30d`
- **No TLS yet** — Initially HTTP-only; HTTPS can be added later by mounting certs volume

**Files:** [`nginx-hyperpush.conf`](deploy/nginx-hyperpush.conf) · [`compose.prod.yml`](deploy/compose.prod.yml)

---

## 🏛️ System Architecture

```mermaid
graph TB
    subgraph Internet["Internet"]
        User["User Browser"]
        CPClient["React Native Client<br/>code-push SDK"]
    end

    subgraph Nginx["Nginx Reverse Proxy"]
        CP["codepush.hyperpush.dev<br/>→ code-push-server:3000"]
        Console["console.hyperpush.dev<br/>/ → Frontend SPA<br/>/graphql → Backend API"]
    end

    subgraph VPS["VPS · Docker Compose"]
        Frontend["Frontend<br/>Nginx · Static SPA"]
        Backend["NestJS 11 BFF<br/>GraphQL Apollo 5 · JWT"]
        CodePush["code-push-server<br/>REST API · v5.7.1"]
        DB[("App DB<br/>SQLite / PostgreSQL<br/>Prisma 7 ORM")]
        MySQL[("CodePush DB<br/>MySQL 8.0")]
        Redis[("Redis 7<br/>CodePush Storage")]
    end

    User --> Console
    CPClient --> CP
    Console --> Frontend
    Console --> Backend
    CP --> CodePush
    Backend --> DB
    Backend -->|REST Proxy| CodePush
    CodePush --> MySQL
    CodePush --> Redis
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, TypeScript 5.7, Vite 8, Tailwind CSS 4, shadcn/ui, TanStack Router |
| **State Management** | Redux Toolkit 2 (global), Apollo Client 5 (GraphQL cache), TanStack React Query (server) |
| **Backend** | NestJS 11, Apollo Server 5 (code-first), Passport.js (JWT), bcrypt |
| **Database** | Prisma 7 ORM, SQLite (dev), PostgreSQL 16 (prod), MySQL 8.0 (code-push-server) |
| **Cache** | Redis 7 (code-push-server storage) |
| **Infrastructure** | Docker, Docker Compose, Nginx (reverse proxy) |
| **CI/CD** | GitHub Actions, AWS CDK (TypeScript), GHCR (container registry) |
| **Code Quality** | Biome (linter + formatter), tsconfig strict mode |
| **Auth** | JWT (access tokens), bcrypt password hashing, Passport GQL guard |

---

## 📁 Project Structure

```
hyperpush/
├── backend/                          # NestJS 11 BFF (GraphQL + REST proxy)
│   ├── src/
│   │   ├── auth/                     # JWT auth module (register, login, profile)
│   │   │   ├── auth.resolver.ts      # GraphQL mutations: register, login, updateUser
│   │   │   ├── auth.service.ts       # Business logic, bcrypt hashing, JWT signing
│   │   │   └── jwt.strategy.ts       # Passport JWT extraction from Bearer header
│   │   ├── codepush/                 # CodePush proxy module (core feature)
│   │   │   ├── codepush.service.ts   # REST proxy with JWT injection per server
│   │   │   ├── codepush.resolver.ts  # GraphQL queries/mutations for CodePush ops
│   │   │   └── codepush.controller.ts# REST multipart upload endpoint
│   │   ├── servers/                  # Server CRUD (manage code-push-server instances)
│   │   ├── api-keys/                 # API key management for programmatic access
│   │   ├── audit-log/               # Audit trail for all operations
│   │   ├── prisma/                   # Prisma service (database access)
│   │   └── graphiql/                 # GraphiQL IDE playground (dev)
│   ├── prisma/
│   │   └── schema.prisma             # Data model: User, Server, App, Deployment, Release, ApiKey, AuditLog
│   └── Dockerfile                    # 3-stage: builder → development → production
│
├── frontend/                         # React 19 SPA (admin console)
│   ├── src/app/
│   │   ├── routes/                   # TanStack Router pages
│   │   │   ├── dashboard/            # Authenticated routes
│   │   │   │   ├── CodePushPage      # CodePush app/deployment management
│   │   │   │   ├── ServersPage       # Server instance CRUD
│   │   │   │   ├── AppDetailPage     # Single app detail + deployments list
│   │   │   │   ├── ServerDetailPage  # Single server detail + token management
│   │   │   │   ├── ApiKeysPage       # API key management
│   │   │   │   ├── AuditLogsPage     # Audit log viewer with filters
│   │   │   │   ├── SettingsPage      # User settings
│   │   │   │   └── DashboardHome     # Overview dashboard
│   │   │   ├── LoginPage             # Authentication
│   │   │   └── RegisterPage          # Registration
│   │   ├── store/                    # Redux Toolkit (auth + theme slices)
│   │   ├── lib/                      # Apollo Client + GraphQL operations
│   │   ├── components/               # Shared UI (Header, Sidebar, ThemeProvider)
│   │   └── types/                    # TypeScript interfaces (models.ts, graphql.ts)
│   ├── components/ui/                # shadcn/ui primitives (badge, button, dialog, select, table, tabs, skeleton)
│   └── Dockerfile                    # 5-stage: base → deps → dev → build → production (Nginx)
│
├── deploy/                           # Production deployment files
│   ├── nginx-hyperpush.conf          # Nginx reverse proxy config
│   └── compose.prod.yml              # Production Docker Compose
│
├── infra/                            # AWS CDK infrastructure (TypeScript)
│   └── lib/hyperpush-stack.ts        # VPC, ECS, RDS, Redis, ALB
│
├── compose.yml                       # Base Docker Compose (dev)
├── compose.dev.yml                   # Dev overrides (hot reload)
├── compose.codepush.yml              # CodePush services (MySQL 8.0, Redis 7)
└── Makefile                          # Shortcuts: dev-up, dev-down, prod-up
```

---

## 🚀 Quick Start

### Prerequisites

- **Docker** 24+ & **Docker Compose** 2.x
- **Bun** 1.3+ (for local dev)
- **Node.js** 22+ (for NestJS CLI)

### 1. Clone & Install

```bash
git clone https://github.com/MrBigPorter/hyperpush.git
cd hyperpush
cd backend && bun install && cd ..
cd frontend && bun install && cd ..
```

### 2. Environment Configuration

```bash
cp backend/.env.example backend/.env
# Edit backend/.env — JWT_SECRET is the only required change for local dev
```

| Variable | Default | Notes |
|----------|---------|-------|
| `DATABASE_URL` | `file:./dev.db` | SQLite for local dev (no PostgreSQL needed) |
| `JWT_SECRET` | `your-jwt-secret-change-in-production` | Change for production |
| `PORT` | `3000` | Backend server port |

### 3. Start Development Environment

```bash
# Start all services with hot reload
docker compose -f compose.yml -f compose.dev.yml up -d --build

# Or use the Makefile shortcut
make dev-up
```

### 4. Database Initialization

```bash
# The backend auto-runs Prisma migrations on startup (see main.ts)
# Wait for the backend to be ready:
docker compose logs -f app | grep -m1 "Nest application successfully started"

# If needed, run migrations manually:
docker compose exec app npx prisma migrate dev
```

### 5. Access

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | Vite dev server with HMR |
| **Backend API** | http://localhost:3000/graphql | GraphQL endpoint |
| **GraphiQL** | http://localhost:3000/graphql | Interactive GraphQL IDE |
| **CodePush** | http://localhost:3001 | code-push-server |

---

## ⌨️ Available Commands

### Development

| Command | Description |
|---------|-------------|
| `make dev-up` | Start all dev services (Docker Compose) |
| `make dev-down` | Stop all dev services |
| `make prod-up` | Start production stack |
| `docker compose logs -f app` | Watch backend logs |
| `docker compose logs -f frontend` | Watch frontend logs |

### Docker

| Command | Description |
|---------|-------------|
| `docker compose build --no-cache` | Rebuild all images from scratch |
| `docker compose down -v` | Stop and remove volumes (⚠️ deletes DB data) |
| `docker compose ps` | Check container status |
| `docker system prune -a` | Clean up unused Docker resources |

### Database

| Command | Description |
|---------|-------------|
| `docker compose exec app npx prisma migrate dev` | Run pending migrations |
| `docker compose exec app npx prisma studio` | Open Prisma Studio (data browser) |
| `docker compose exec app npx prisma migrate reset` | Reset database (⚠️ deletes all data) |

### Deploy

| Command | Description |
|---------|-------------|
| `make prod-up` | Pull latest images and start production stack |
| `docker compose -f compose.yml -f compose.codepush.yml -f deploy/compose.prod.yml pull` | Pre-pull images before deploy |
| `docker compose -f compose.yml -f compose.codepush.yml -f deploy/compose.prod.yml up -d` | Start production services |

---

## 🔄 CI/CD Pipeline

```mermaid
graph LR
    Push["Push to main"] --> Build["Build Docker Images"]
    Build --> GHCR["Push to GHCR<br/>ghcr.io/hyperpush-*:latest"]

    GHCR --> VPSWorkflow["Deploy to VPS"]
    GHCR --> AWSWorkflow["Deploy to AWS"]

    subgraph VPS["VPS (Docker Compose)"]
        SSH["SSH Auth Verify"] --> Tar["tar + scp<br/>compose.yml + deploy/"]
        Tar --> Extract["ssh extract"]
        Extract --> ComposeUp["docker compose up -d"]
    end

    subgraph AWS["AWS ECS (CDK)"]
        Synth["CDK Synth"] --> Deploy["cdk deploy"]
        Deploy --> ECS["ECS Fargate + RDS + ALB"]
    end

    VPSWorkflow --> VPS
    AWSWorkflow --> AWS
```

- **VPS Workflow**: [`deploy-vps.yml`](.github/workflows/deploy-vps.yml) — Build → SSH verify → File sync → Docker Compose deploy
- **AWS Workflow**: [`deploy.yml`](.github/workflows/deploy.yml) — Build → CDK Synth → ECS Fargate deploy
- **CI Workflow**: [`ci.yml`](.github/workflows/ci.yml) — Biome lint + TypeScript check on every PR
- **Progressive SSH diagnostics**: Port check → Key validation → Auth test → File transfer, each with actionable error messages

---

## 💬 Interview Talking Points

| Topic | What to Say |
|-------|-------------|
| **BFF Architecture** | "I designed a NestJS BFF that serves as a GraphQL gateway while proxying REST requests to code-push-server with per-server JWT injection. This lets the frontend use flexible GraphQL queries while maintaining compatibility with the existing CodePush REST API." |
| **CodePush Proxy Auth** | "code-push-server expects Bearer JWT tokens for every request. My solution stores per-server tokens in the database and injects them transparently via a `fetchWithAuth` wrapper. This means the frontend never handles CodePush credentials directly." |
| **SSH Reliability** | "The `appleboy/scp-action` v0.1.7 uses drone-scp v1.6.14, which has a known SSH handshake failure with ED25519 keys. I replaced it with a native `tar + scp + ssh` pipeline with progressive diagnostics — each step validates before proceeding and prints actionable error messages." |
| **State Management Strategy** | "Three layers with strict separation: Redux for global UI state (auth, theme), Apollo Client for GraphQL cache normalization, and TanStack Query for REST server state. They never overlap — the rule is: if it's from GraphQL, it's Apollo; if from REST, it's TanStack Query; if pure UI, it's Redux." |
| **Dual CI/CD** | "The same codebase deploys to two targets: VPS Docker Compose for cost efficiency and rapid iteration, and AWS ECS via CDK for production scalability. Both use the same Docker images from GHCR, so images are built once and deployed to both targets." |
| **Multi-stage Docker** | "The frontend Dockerfile has 5 stages with strategic COPY ordering — `package.json` first (rarely changes → cached), then source code. This cuts CI build times from ~2min to ~30s. Production stage uses `nginx:1.27-alpine` (~23MB) instead of the full Node.js image." |
| **Database Flexibility** | "Local dev uses SQLite via Prisma's `adapter-pg` compatibility layer — no PostgreSQL installation needed. Production uses PostgreSQL. The Prisma schema is the single source of truth, and migrations auto-run on startup in the backend's `bootstrap` hook." |
| **Nginx Reverse Proxy** | "Nginx runs in a Docker container with hot-reloadable config. One config file routes two domains (console + codepush) to the right internal services with path-based routing, static caching, and large upload support." |
| **Audit Logging** | "Every CodePush operation (release, deployment change, app creation) is logged with user ID, timestamp, and action details. The audit log is queryable via GraphQL with filtering and pagination." |
| **Project Ownership** | "I designed the architecture, implemented the full-stack code, containerized everything, set up CI/CD for both VPS and AWS, and wrote all documentation. This is a solo project from start to finish." |

---

## 👤 My Role

As the **sole developer and architect** of this project, I:

- 🏛️ **Architected** the entire BFF system — NestJS 11 GraphQL gateway with code-push-server REST proxy integration
- 🎨 **Built** the React 19 admin console from scratch — 8 dashboard pages with TanStack Router, shadcn/ui, Tailwind CSS 4
- ⚙️ **Developed** the backend API — Apollo Server 5 code-first GraphQL, JWT auth with Passport, Prisma 7 ORM
- 🔐 **Implemented** multi-server CodePush authentication — per-server scoped JWT tokens with transparent injection
- 📊 **Created** the audit logging system — full CRUD audit trail for all CodePush operations
- 🐳 **Containerized** the entire stack — 5-stage frontend Docker build, 3-stage backend, Docker Compose orchestration
- 🚀 **Designed** dual CI/CD pipelines — VPS (Docker Compose with native SSH) + AWS (ECS Fargate via CDK)
- ☁️ **Set up** Nginx reverse proxy — container-based with hot reload, Docker DNS resolver
- 📝 **Wrote** comprehensive documentation — deployment guide, development guide, architecture analysis

---

## 📄 License

This project is private and not licensed for public use.

---

<div align="center">

**Built with** ❤️ **using** React · NestJS · GraphQL · Prisma · Docker · Nginx

</div>
