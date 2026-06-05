# 📁 Project Structure

Complete directory tree with descriptions for every file in the HyperPush project.

---

## 📂 Root

```
hyperpush/
├── .github/                          # GitHub configuration
│   ├── workflows/
│   │   ├── ci.yml                    # PR checks: lint, typecheck, npm audit
│   │   ├── deploy-vps.yml            # VPS Docker Compose deployment
│   │   └── deploy.yml                # AWS ECS CDK deployment
│   └── dependabot.yml                # Weekly automated dependency updates
│
├── .husky/                           # Git hooks (pre-commit lint)
├── .vscode/                          # VS Code workspace settings
│
├── backend/                          # 🟢 NestJS 11 BFF
│   ├── .env.example                  # Environment variable template
│   ├── .husky/                       # Backend-specific git hooks
│   ├── Dockerfile                    # 3-stage Docker build
│   ├── bun.lock                      # Bun lockfile
│   ├── nest-cli.json                 # NestJS CLI configuration
│   ├── package.json                  # Dependencies and scripts
│   ├── prisma/
│   │   ├── schema.prisma             # Data model (6 models: User, Server, App, Deployment, Release, ApiKey, AuditLog)
│   │   └── migrations/               # Prisma migration history
│   ├── prisma.config.ts              # Prisma adapter configuration
│   ├── schema.gql                    # Auto-generated GraphQL schema
│   ├── scripts/
│   │   └── validate-di.mts           # Dependency injection validation script
│   ├── src/
│   │   ├── main.ts                   # Application bootstrap: CORS, Helmet, Prisma migration hook
│   │   ├── app.module.ts             # Root module: imports, GraphQL config, rate limiting
│   │   ├── app.resolver.ts           # Root GraphQL resolver
│   │   ├── api-keys/                 # API key management module
│   │   │   ├── api-keys.module.ts    # Module definition
│   │   │   ├── api-keys.resolver.ts  # GraphQL: createApiKey, deleteApiKey
│   │   │   ├── api-keys.service.ts   # Business logic: key generation with crypto, hashing
│   │   │   ├── dto/
│   │   │   │   ├── create-api-key.input.ts  # Input type for key creation
│   │   │   │   └── index.ts          # Barrel export
│   │   │   └── models/
│   │   │       └── api-key.model.ts  # GraphQL ObjectType
│   │   ├── audit-log/                # Audit trail module
│   │   │   ├── audit-log.module.ts   # Module definition (not global, imported per-feature)
│   │   │   ├── audit-log.resolver.ts # GraphQL: getAuditLogs, createAuditLog
│   │   │   ├── audit-log.service.ts  # CRUD for audit logs with filtering/pagination
│   │   │   ├── dto/
│   │   │   │   ├── audit-log-filter.input.ts  # Filter by userId, action, entity, date range
│   │   │   │   └── index.ts
│   │   │   └── models/
│   │   │       ├── audit-log.model.ts          # GraphQL ObjectType
│   │   │       ├── audit-log-list.response.ts  # Paginated response
│   │   │       └── pagination-info.model.ts    # Pagination metadata
│   │   ├── auth/                     # Authentication module
│   │   │   ├── auth.module.ts        # Module: imports, JWT strategy, Throttler, 2FA
│   │   │   ├── auth.resolver.ts      # GraphQL: register, login, verify2fa, banUser, listUsers
│   │   │   ├── auth.service.ts       # Business logic: registration, login, password policy, lockout, audit
│   │   │   ├── jwt.strategy.ts       # Passport JWT strategy: token validation from DB
│   │   │   ├── two-factor.service.ts # TOTP: speakeasy + AES-256-GCM encrypted storage
│   │   │   ├── dto/
│   │   │   │   ├── register.input.ts       # Registration input (with optional recaptchaToken)
│   │   │   │   ├── login.input.ts          # Login input (with optional recaptchaToken)
│   │   │   │   ├── verify-2fa.input.ts     # 2FA verification input
│   │   │   │   ├── change-password.input.ts# Password change input
│   │   │   │   ├── update-user.input.ts    # Profile update input
│   │   │   │   └── index.ts
│   │   │   ├── guards/
│   │   │   │   ├── gql-auth.guard.ts       # GraphQL auth guard (JWT)
│   │   │   │   └── gql-throttler.guard.ts  # GraphQL rate limit guard
│   │   │   └── models/
│   │   │       ├── auth.model.ts           # Auth response (accessToken + user)
│   │   │       └── user.model.ts           # User GraphQL type
│   │   ├── codepush/                 # 🔴 CodePush proxy (core feature)
│   │   │   ├── codepush.module.ts    # Module definition (skipped for audit logging — proxies external)
│   │   │   ├── codepush.resolver.ts  # GraphQL: 15+ CodePush operations
│   │   │   ├── codepush.service.ts   # REST proxy: per-server JWT injection via fetchWithAuth
│   │   │   ├── codepush-db.service.ts# MySQL connection: auto-creates CodePush admin user
│   │   │   ├── codepush.controller.ts# REST controller: multipart upload handling
│   │   │   └── dto/
│   │   │       ├── create-access-key.input.ts
│   │   │       ├── create-app.input.ts
│   │   │       ├── create-deployment.input.ts
│   │   │       ├── promote-release.input.ts
│   │   │       ├── update-app.input.ts
│   │   │       ├── update-deployment.input.ts
│   │   │       ├── update-release.input.ts
│   │   │       └── index.ts
│   │   ├── common/                   # Shared modules
│   │   │   ├── recaptcha/            # reCAPTCHA v3 verification
│   │   │   │   ├── recaptcha.module.ts
│   │   │   │   └── recaptcha.service.ts  # Google API verification with configurable threshold
│   │   │   └── scalars/
│   │   │       └── json.scalar.ts    # Custom JSON GraphQL scalar
│   │   ├── graphiql/                 # GraphiQL IDE (dev only)
│   │   │   ├── graphiql.controller.ts
│   │   │   └── graphiql.module.ts
│   │   ├── prisma/                   # Database service
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts     # Prisma client with lifecycle hooks
│   │   ├── servers/                  # Server CRUD module
│   │   │   ├── servers.module.ts
│   │   │   ├── servers.resolver.ts   # GraphQL: createServer, updateServer, deleteServer
│   │   │   ├── servers.service.ts    # Business logic with CodePush login verification
│   │   │   ├── dto/
│   │   │   │   ├── create-server.input.ts
│   │   │   │   ├── update-server.input.ts
│   │   │   │   └── index.ts
│   │   │   └── models/
│   │   │       └── server.model.ts
│   │   └── types/
│   │       └── graphql-depth-limit.d.ts  # Type declaration for depth-limit
│   └── tsconfig.json                 # TypeScript config (strict mode)
│   └── tsconfig.build.json           # Build-specific TS config
│
├── deploy/                           # Production deployment files
│   └── compose.prod.yml              # Production Docker Compose overrides (Nginx, env vars, volumes)
│
├── frontend/                         # 🔵 React 19 SPA
│   ├── Dockerfile                    # 5-stage: base → deps → dev → build → nginx production
│   ├── bun.lock                      # Bun lockfile
│   ├── components.json               # shadcn/ui configuration
│   ├── index.html                    # HTML entry point
│   ├── package.json                  # Dependencies and scripts
│   ├── tsconfig.json                 # TypeScript config
│   ├── tsconfig.node.json            # Node-specific TS config
│   ├── vite.config.ts                # Vite bundler configuration
│   ├── wrangler.toml                 # Cloudflare Workers config (optional)
│   ├── functions/                    # Cloudflare Functions (optional)
│   │   └── graphql/                  # GraphQL edge proxy
│   ├── public/
│   │   └── logo.png                  # Application logo
│   └── src/
│       ├── app/
│       │   ├── App.tsx               # Root component: providers (Apollo, Redux, Theme, Recaptcha, Router)
│       │   ├── globals.css           # Tailwind CSS 4 imports + base styles
│       │   ├── main.tsx              # React entry point + StrictMode
│       │   ├── router.ts             # TanStack Router configuration
│       │   ├── components/
│       │   │   ├── Header.tsx        # Top navigation bar
│       │   │   ├── Sidebar.tsx       # Side navigation with links
│       │   │   ├── ThemeProvider.tsx  # Dark/light theme context
│       │   │   ├── ThemeToggle.tsx    # Theme toggle button
│       │   │   ├── RecaptchaProvider.tsx # reCAPTCHA v3 context provider
│       │   │   └── ui/              # Shared UI primitives (Card, Button, Input)
│       │   │       ├── Button.tsx
│       │   │       ├── Card.tsx
│       │   │       ├── Input.tsx
│       │   │       └── index.ts
│       │   ├── hooks/
│       │   │   ├── index.ts
│       │   │   └── useAppStore.ts    # Redux store hook
│       │   ├── lib/
│       │   │   ├── apollo.ts         # Apollo Client: auth link, HTTP link, error handling
│       │   │   └── graphql.ts        # All GraphQL query/mutation definitions
│       │   ├── routes/
│       │   │   ├── __root.tsx        # Router root layout
│       │   │   ├── index.tsx         # Home/public page
│       │   │   ├── LoginPage.tsx     # Login form (step 1: credentials, step 2: TOTP)
│       │   │   ├── RegisterPage.tsx  # Registration form
│       │   │   ├── dashboard.tsx     # Dashboard layout route
│       │   │   ├── DashboardLayout.tsx # Dashboard shell (Header + Sidebar + content)
│       │   │   ├── register.tsx      # Register route config
│       │   │   └── dashboard/
│       │   │       ├── index.ts      # Dashboard route definitions
│       │   │       ├── home.tsx      # Dashboard home route
│       │   │       ├── DashboardHome.tsx   # Overview: servers, apps, audit summary
│       │   │       ├── servers.tsx         # Servers list route
│       │   │       ├── ServersPage.tsx     # Server CRUD: create, edit, delete
│       │   │       ├── server-detail.tsx   # Server detail route
│       │   │       ├── ServerDetailPage.tsx # Server detail: apps, access keys
│       │   │       ├── app-detail.tsx      # App detail route
│       │   │       ├── AppDetailPage.tsx   # App detail: deployments, collaborators
│       │   │       ├── codepush.tsx        # CodePush route
│       │   │       ├── CodePushPage.tsx    # CodePush app/deployment management
│       │   │       ├── api-keys.tsx        # API keys route
│       │   │       ├── ApiKeysPage.tsx     # API key generation and revocation
│       │   │       ├── audit-logs.tsx      # Audit logs route
│       │   │       ├── AuditLogsPage.tsx   # Audit log viewer with filtering
│       │   │       ├── settings.tsx        # Settings route
│       │   │       └── SettingsPage.tsx    # User settings: profile, password, 2FA
│       │   ├── store/
│       │   │   ├── index.ts              # Redux store: configureStore
│       │   │   └── slices/
│       │   │       ├── authSlice.ts    # Auth state: user, token, login/logout actions
│       │   │       └── themeSlice.ts   # Theme state: dark/light mode
│       │   ├── styles/                  # Additional styles
│       │   └── types/
│       │       ├── index.ts
│       │       ├── auth.ts              # Auth-related TypeScript types
│       │       ├── graphql.ts           # GraphQL-generated TypeScript types
│       │       └── models.ts            # Data model interfaces (Server, App, Deployment, etc.)
│       ├── components/ui/               # shadcn/ui primitives
│       │   ├── badge.tsx
│       │   ├── button.tsx
│       │   ├── dialog.tsx
│       │   ├── select.tsx
│       │   ├── skeleton.tsx
│       │   ├── table.tsx
│       │   └── tabs.tsx
│       └── lib/
│           └── utils.ts                 # Tailwind CSS class merging utility
│
├── infra/                           # ☁️ AWS CDK infrastructure (TypeScript)
│   ├── .gitignore
│   ├── cdk.json                     # CDK app configuration
│   ├── package.json
│   ├── tsconfig.json
│   ├── bin/
│   │   └── hyperpush.ts             # CDK app entry point
│   └── lib/
│       └── hyperpush-stack.ts       # Stack: VPC, ECS Fargate, RDS, Redis, ALB, ECR
│
├── .dockerignore                    # Docker build exclusions
├── .gitignore                       # Git exclusions
├── biome.json                       # Biome linter + formatter configuration
├── Makefile                         # Command shortcuts: dev-up, dev-down, prod-up
├── compose.yml                      # Base Docker Compose (dev services)
├── compose.dev.yml                  # Dev overrides (hot reload, volume mounts)
└── compose.codepush.yml             # CodePush services (MySQL 8.0, Redis 7)
```
