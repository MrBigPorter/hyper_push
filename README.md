# 🚀 HyperPush — CodePush Universal Management Console

[![CI](https://github.com/MrBigPorter/hyperpush/actions/workflows/ci.yml/badge.svg)](https://github.com/MrBigPorter/hyperpush/actions/workflows/ci.yml)
[![Deploy to VPS](https://github.com/MrBigPorter/hyperpush/actions/workflows/deploy-vps.yml/badge.svg)](https://github.com/MrBigPorter/hyperpush/actions/workflows/deploy-vps.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white)
![GraphQL](https://img.shields.io/badge/GraphQL-E10098?logo=graphql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)

**HyperPush** is a full-stack admin console for managing multiple `code-push-server` instances through a unified **Backend-for-Frontend (BFF)** GraphQL gateway.

---

## ✨ What It Does

`code-push-server` (the open-source backend for Microsoft's CodePush) has no built-in admin UI. HyperPush fills that gap — a modern React dashboard that lets you manage apps, deployments, releases, collaborators, and access keys across any number of CodePush servers, all from one place.

```
Add a server → See all its apps → Manage deployments → Release updates → Track audit logs
```

---

## 🏛️ Architecture at a Glance

```
Browser (React 19) ──GraphQL──► NestJS 11 BFF ──REST──► code-push-server A
                                  │                    └── code-push-server B
                                  │                    └── code-push-server N
                                  └── PostgreSQL / SQLite
```

- **BFF pattern**: Frontend speaks GraphQL; BFF proxies REST to CodePush servers with transparent JWT injection
- **3-layer state**: Redux Toolkit (UI) + Apollo Client (GraphQL) + TanStack Query (REST) — strictly separated
- **Dual CI/CD**: Same Docker images deploy to VPS (Docker Compose) and AWS ECS (CDK)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TanStack Router, shadcn/ui, Tailwind CSS 4, Apollo Client, Redux Toolkit |
| **Backend** | NestJS 11, Apollo Server 5 (code-first), Passport.js JWT, Prisma 7 |
| **Database** | SQLite (dev), PostgreSQL 16 (prod) |
| **Infrastructure** | Docker Compose (VPS), AWS CDK (ECS Fargate, RDS, Redis) |
| **CI/CD** | GitHub Actions, GHCR, npm audit, Dependabot |

---

## 🔐 Security Features

| Feature | Implementation |
|---------|---------------|
| JWT Authentication | Passport.js with configurable expiration |
| TOTP 2FA | Google Authenticator, encrypted secrets (AES-256-GCM) |
| reCAPTCHA v3 | Bot detection on login/register |
| Password Policy | Min 8 chars, complexity requirements |
| Login Lockout | 5 attempts → 15 min auto-expiring lockout |
| Rate Limiting | @nestjs/throttler (100 req/min global, 10 req/min login) |
| Helmet | HTTP security headers |
| GraphQL Depth Limit | Max 7 levels (prevents deep-nested attacks) |
| GraphQL Introspection | Disabled in production |
| npm audit | CI scans for high/critical vulnerabilities |
| Dependabot | Weekly automated dependency updates |
| Docker USER node | Non-root container execution |

---

## 🚀 Quick Start

```bash
# Prerequisites: Docker 24+, Bun 1.3+, Node.js 22+
git clone https://github.com/MrBigPorter/hyperpush.git
cd hyperpush
cp backend/.env.example backend/.env   # Edit JWT_SECRET
make dev-up                             # Start all services
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| GraphQL API | http://localhost:3000/graphql |
| GraphiQL IDE | http://localhost:3000/graphql |
| CodePush | http://localhost:3001 |

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [**Index**](docs/index.md) | Project overview and feature summary |
| [**Getting Started**](docs/getting-started.md) | Setup guide in 5 minutes |
| [**Architecture**](docs/architecture.md) | System design, data flow, component interaction |
| [**Development**](docs/development.md) | Backend/frontend dev workflow, database, testing |
| [**Deployment**](docs/deployment.md) | VPS Docker Compose deployment, SSH, secrets |
| [**Security**](docs/security.md) | All security features, configuration, hardening |
| [**API**](docs/api.md) | GraphQL queries, mutations, input types, models |
| [**CI/CD**](docs/cicd.md) | GitHub Actions pipelines, Docker builds |
| [**Project Structure**](docs/project-structure.md) | Directory tree with file-by-file descriptions |

---

## 🔑 Key Features

- **Multi-Server Management** — Add any number of code-push-server instances; manage all from one dashboard
- **Full CodePush CRUD** — Apps, deployments, releases, collaborators, access keys
- **Release Management** — Release, promote, rollback, clear history, deployment metrics
- **Audit Logging** — Full audit trail with filtering and pagination
- **User Management** — Registration, profiles, password changes, admin ban/unban
- **Two-Factor Auth** — TOTP-based 2FA with encrypted secret storage
- **API Key Management** — Programmatic access with configurable expiration
- **Dark Mode** — Full dark mode with theme persistence

---

## 📄 License

This project is private and not licensed for public use.

---

<div align="center">

**Built with** ❤️ **using** React · NestJS · GraphQL · Prisma · Docker

</div>
