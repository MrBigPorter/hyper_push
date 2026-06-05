# 🚀 HyperPush — CodePush Universal Management Console

[![CI](https://github.com/MrBigPorter/hyperpush/actions/workflows/ci.yml/badge.svg)](https://github.com/MrBigPorter/hyperpush/actions/workflows/ci.yml)
[![Deploy to VPS](https://github.com/MrBigPorter/hyperpush/actions/workflows/deploy-vps.yml/badge.svg)](https://github.com/MrBigPorter/hyperpush/actions/workflows/deploy-vps.yml)

**HyperPush** is a full-stack admin console for managing multiple code-push-server instances through a unified GraphQL gateway. It provides a modern React dashboard for CodePush operations — apps, deployments, releases, collaborators, access keys — across any number of remote CodePush servers, all from a single interface.

---

## ✨ Overview

HyperPush solves a fundamental problem: `code-push-server` (the open-source backend for Microsoft's CodePush technology) has no built-in admin UI. Each server is managed via CLI or raw REST calls. HyperPush wraps one or more CodePush servers in a modern web console with:

- **Unified management** — Add any number of CodePush servers, each with its own credentials, and manage all resources through one dashboard
- **BFF architecture** — A NestJS 11 Backend-for-Frontend that presents a GraphQL API to the React frontend while proxying REST calls to code-push-server instances with transparent JWT injection
- **Production-grade security** — JWT authentication, TOTP two-factor authentication, reCAPTCHA v3, password policy enforcement, login lockout, rate limiting, audit logging, and dependency vulnerability scanning
- **Dual deployment targets** — VPS (Docker Compose) for cost efficiency and AWS ECS (CDK) for production scalability, sharing the same Docker images

---

## 🔑 Key Features

| Feature | Description |
|---------|-------------|
| **Multi-Server Management** | Register any number of code-push-server instances; manage all from one dashboard |
| **App & Deployment CRUD** | Create, update, delete, and transfer apps; manage deployments with full release history |
| **Release Management** | Release, promote, rollback, and clear deployment history |
| **Collaborator Management** | Add, remove, and list collaborators per app |
| **Access Key Management** | List, create, and delete access keys per server |
| **Audit Logging** | Full audit trail with filtering and pagination for all CodePush operations |
| **User Management** | Registration, profile updates, password changes, admin ban/unban |
| **Two-Factor Auth** | TOTP-based 2FA (Google Authenticator, Authy, etc.) |
| **API Key Management** | Create and revoke API keys with configurable expiration |
| **Dark Mode** | Full dark mode support with theme persistence |

---

## 🧠 Technical Highlights

- **5-stage multi-architecture Docker builds** — Frontend builds cross-platform (linux/amd64, linux/arm64) with Nginx in production
- **3-layer state management** — Redux Toolkit (global UI), Apollo Client (GraphQL cache), TanStack Query (REST server state) with strict separation
- **Progressive SSH diagnostics** — Port check → Key validation → Auth test → File transfer, each with actionable error messages
- **GraphQL depth limiting** — Maximum query depth of 7 to prevent malicious deep-nested queries
- **Auto-migration on startup** — Prisma migrations run automatically when the backend boots

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [**Getting Started**](getting-started.md) | Clone, configure, and run the project in 5 minutes |
| [**Architecture**](architecture.md) | System architecture, data flow, and design decisions |
| [**Development**](development.md) | Development workflow, backend, frontend, database, testing |
| [**Deployment**](deployment.md) | Production deployment to VPS (Docker Compose) |
| [**Security**](security.md) | Security features, configuration, and hardening |
| [**API**](api.md) | GraphQL API reference — queries, mutations, models |
| [**CI/CD**](cicd.md) | CI/CD pipeline — GitHub Actions workflows |
| [**Project Structure**](project-structure.md) | Directory tree with file-by-file descriptions |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, TanStack Router, shadcn/ui, Tailwind CSS 4, Apollo Client, Redux Toolkit |
| **Backend** | NestJS 11, Apollo Server 5 (code-first GraphQL), Passport.js (JWT), Prisma 7 ORM |
| **Database** | SQLite (dev), PostgreSQL 16 (prod) |
| **Proxy** | CodePush REST proxy with per-server JWT injection |
| **Container** | Docker, Docker Compose, multi-stage builds |
| **CI/CD** | GitHub Actions, GHCR (image registry) |
| **Infrastructure** | AWS CDK (ECS Fargate, RDS, ALB, Redis) |
| **Deployment** | VPS (Docker Compose + Nginx/JoyMini), AWS ECS (CDK) |

---

## 🔗 Quick Links

- **Repository**: [github.com/MrBigPorter/hyperpush](https://github.com/MrBigPorter/hyperpush)
- **CI Workflow**: [`.github/workflows/ci.yml`](/.github/workflows/ci.yml)
- **VPS Deploy**: [`.github/workflows/deploy-vps.yml`](/.github/workflows/deploy-vps.yml)
- **Docker Compose**: [`compose.yml`](/compose.yml), [`compose.dev.yml`](/compose.dev.yml), [`deploy/compose.prod.yml`](/deploy/compose.prod.yml)
- **Backend**: [`backend/src/main.ts`](/backend/src/main.ts)
- **Frontend**: [`frontend/src/app/App.tsx`](/frontend/src/app/App.tsx)
- **Prisma Schema**: [`backend/prisma/schema.prisma`](/backend/prisma/schema.prisma)
