# 🚀 Getting Started

Get HyperPush running on your local machine in 5 minutes.

---

## 📋 Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| **Docker** | 24+ | Required for running services |
| **Docker Compose** | 2.x | Included with Docker Desktop |
| **Bun** | 1.3+ | For local development |
| **Node.js** | 22+ | For NestJS CLI |

### Verify Installation

```bash
docker --version
docker compose version
bun --version
node --version
```

---

## ⚡ Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/MrBigPorter/hyperpush.git
cd hyperpush

# Install backend dependencies
cd backend && bun install && cd ..

# Install frontend dependencies
cd frontend && bun install && cd ..
```

### 2. Environment Configuration

```bash
cp backend/.env.example backend/.env
```

Edit [`backend/.env`](/backend/.env) — the only required change for local development is `JWT_SECRET`:

| Variable | Default | Notes |
|----------|---------|-------|
| `DATABASE_URL` | `file:./dev.db` | SQLite for local dev (no PostgreSQL needed) |
| `JWT_SECRET` | `your-jwt-secret-change-in-production` | **Change for production** |
| `PORT` | `3000` | Backend server port |
| `NODE_ENV` | `development` | Enables debug logging and GraphiQL |
| `RECAPTCHA_SECRET_KEY` | *(empty)* | Optional for local dev; skip reCAPTCHA in dev mode |

### 3. Start Development

```bash
# Start all services with hot reload
docker compose -f compose.yml -f compose.dev.yml up -d --build

# Or use the Makefile shortcut
make dev-up
```

This starts:

| Service | Container | Description |
|---------|-----------|-------------|
| **Frontend** | `hyperpush-frontend-dev` | Vite dev server with HMR on port 5173 |
| **Backend** | `hyperpush-app-dev` | NestJS with hot reload on port 3000 |
| **CodePush** | `hyperpush-codepush-dev` | code-push-server on port 3001 |
| **MySQL** | `hyperpush-mysql-dev` | CodePush database (MySQL 8.0) |
| **Redis** | `hyperpush-redis-dev` | CodePush cache (Redis 7) |

### 4. Database Initialization

The backend auto-runs Prisma migrations on startup. Wait for it:

```bash
docker compose logs -f app | grep -m1 "Nest application successfully started"
```

If migrations need to be run manually:

```bash
docker compose exec app npx prisma migrate dev
```

### 5. Access the Application

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | Vite dev server with HMR |
| **Backend API** | http://localhost:3000/graphql | GraphQL endpoint |
| **GraphiQL** | http://localhost:3000/graphql | Interactive GraphQL IDE (dev only) |
| **CodePush** | http://localhost:3001 | code-push-server |

### 6. Register Your First Account

1. Open http://localhost:5173
2. Click **Register** and create an account
3. The first registered user is automatically set as admin
4. Start adding CodePush servers from the dashboard

---

## ⌨️ Common Commands

### Development

| Command | Description |
|---------|-------------|
| `make dev-up` | Start all dev services |
| `make dev-down` | Stop all dev services |
| `docker compose logs -f app` | Watch backend logs |
| `docker compose logs -f frontend` | Watch frontend logs |
| `docker compose build --no-cache app` | Rebuild backend from scratch |

### Database

| Command | Description |
|---------|-------------|
| `docker compose exec app npx prisma migrate dev` | Run pending migrations |
| `docker compose exec app npx prisma studio` | Open Prisma data browser |
| `docker compose exec app npx prisma migrate reset` | Reset database (⚠️ deletes all data) |

### Docker

| Command | Description |
|---------|-------------|
| `docker compose down -v` | Stop and remove volumes (⚠️ deletes DB data) |
| `docker compose ps` | Check container status |
| `docker system prune -a` | Clean up unused Docker resources |

### Code Quality

| Command | Description |
|---------|-------------|
| `npx @biomejs/biome check --apply .` | Lint and fix all files |
| `cd backend && npx tsc --noEmit` | TypeScript check (backend) |
| `cd frontend && npx tsc --noEmit` | TypeScript check (frontend) |

---

## 🔄 Quick Reset

If something goes wrong:

```bash
make dev-down
docker compose down -v               # ⚠️ Deletes the database
docker compose -f compose.yml -f compose.dev.yml up -d --build
docker compose exec app npx prisma migrate dev
```

---

## 📖 Next Steps

- [Architecture Overview](architecture.md) — Understand the system design
- [Development Guide](development.md) — Backend and frontend development workflow
- [Deployment Guide](deployment.md) — Deploy to production
- [Security Features](security.md) — Security configuration and hardening
