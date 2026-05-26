# CodePush Server API 完整分析 — lisong/code-push-server v5.7.1

> ⚠️ **本文档已根据 GitHub 源码验证**（[lisong/code-push-server v5.7.1](https://github.com/lisong/code-push-server/tree/v5.7.1)）
> 此前版本基于通用理解，与实际源码存在多处差异，现全部修正。
> 
> **更新于 2026-05-26** — 新增「实现状态」列，反映 HyperPush 当前完成情况。

---

## 一、架构回顾

```
┌──────────────┐     GraphQL     ┌──────────────────┐     HTTP REST     ┌─────────────────────┐
│   Web UI     │ ──────────────> │  HyperPush BFF   │ ───────────────> │  lisong/code-push   │
│  (React 19)  │ <────────────── │  (NestJS v11)    │ <─────────────── │  -server v5.7.1     │
└──────────────┘                 │  Proxy Module    │                  │  (port 3001)        │
                                 └──────────────────┘                  └─────────────────────┘
                                                                        ├── MySQL 8.0
                                                                        └── Redis 7 (optional)
```

- HyperPush **不是** CodePush Server 的实现，而是**管理控制台（BFF）**
- `lisong/code-push-server` 运行在独立 Docker 容器中（[`compose.codepush.yml`](../compose.codepush.yml:1)），暴露端口 3001
- HyperPush 通过 `fetch()` 向 `lisong/code-push-server` 发送 HTTP 请求
- 认证机制见下文（有**两种 token 类型**）

---

## 二、lisong/code-push-server v5.7.1 完整 API 清单 + 实现状态

### 2.1 认证 — [`routes/auth.js`](https://github.com/lisong/code-push-server/blob/v5.7.1/routes/auth.js)

| # | 方法 | 路径 | Auth | 请求体 | 响应 | 后端 | 前端 |
|---|------|------|------|--------|------|------|------|
| 1 | POST | `/auth/login` | ❌ | `{ account, password }` | `{ status, results: { tokens } }` 返回 JWT | ✅ Resolver | ❌ |
| 2 | POST | `/auth/logout` | ❌ | — | `"ok"` | ✅ Resolver | ❌ |

### 2.2 访问密钥 — [`routes/accessKeys.js`](https://github.com/lisong/code-push-server/blob/v5.7.1/routes/accessKeys.js)

| # | 方法 | 路径 | 请求体 | 响应 | 后端 | 前端 |
|---|------|------|--------|------|------|------|
| 3 | GET | `/accessKeys` | — | `{ accessKeys: [...] }` | ✅ Service | ❌ |
| 4 | POST | `/accessKeys` | `{ createdBy, friendlyName, ttl?, description? }` | `{ accessKey: { name, createdTime, ... } }` | ✅ Service | ❌ |
| 5 | DELETE | `/accessKeys/:name` | — | `{ friendlyName }` | ✅ Service | ❌ |

### 2.3 账户 — [`routes/account.js`](https://github.com/lisong/code-push-server/blob/v5.7.1/routes/account.js)

| # | 方法 | 路径 | 响应 | 后端 | 前端 |
|---|------|------|------|------|------|
| 6 | GET | `/account` | `{ account: { email, linkedProviders, name } }` | ✅ Resolver | ❌ |

### 2.4 应用 — [`routes/apps.js`](https://github.com/lisong/code-push-server/blob/v5.7.1/routes/apps.js)

| # | 方法 | 路径 | 请求体 | 响应 | 后端 | 前端 |
|---|------|------|--------|------|------|------|
| 7 | GET | `/apps` | — | `{ apps: [...] }` | ✅ Resolver | ❌ |
| 8 | POST | `/apps` | `{ name, os, platform }` | `{ app: { name, collaborators } }` | ✅ Resolver | ❌ |
| 9 | PATCH | `/apps/:appName` | `{ name }` | `""` (空) | ✅ Resolver | ❌ |
| 10 | DELETE | `/apps/:appName` | — | `{ ...data }` | ✅ Resolver | ❌ |
| 12 | POST | `/apps/:appName/transfer/:email` | — | `{ ...data }` | ✅ Resolver | ❌ |
| 13 | GET | `/apps/:appName/collaborators` | — | `{ collaborators: { email: { permission } } }` | ✅ Resolver | ❌ |
| 14 | POST | `/apps/:appName/collaborators/:email` | — | `{ ...data }` | ✅ Resolver | ❌ |
| 15 | DELETE | `/apps/:appName/collaborators/:email` | — | `""` (空) | ✅ Resolver | ❌ |

> ⚠️ 创建应用必须传 `os`（`iOS`/`Android`/`Windows`）和 `platform`（`React-Native`/`Cordova`）

### 2.5 部署 — [`routes/apps.js`](https://github.com/lisong/code-push-server/blob/v5.7.1/routes/apps.js)

| # | 方法 | 路径 | 请求体 | 响应 | 后端 | 前端 |
|---|------|------|--------|------|------|------|
| 16 | GET | `/apps/:appName/deployments` | — | `{ deployments: [...] }` | ✅ Resolver | ❌ |
| 17 | GET | `/apps/:appName/deployments/:deploymentName` | — | `{ deployment: {...} }` | ✅ Resolver | ❌ |
| 18 | POST | `/apps/:appName/deployments` | `{ name }` | `{ deployment: { name, key } }` | ✅ Resolver | ❌ |
| 19 | PATCH | `/apps/:appName/deployments/:deploymentName` | `{ name }` | `{ deployment: data }` | ✅ Resolver | ❌ |
| 20 | DELETE | `/apps/:appName/deployments/:deploymentName` | — | `{ deployment: data }` | ✅ Resolver | ❌ |

### 2.6 发布（Releases） — [`routes/apps.js`](https://github.com/lisong/code-push-server/blob/v5.7.1/routes/apps.js)

| # | 方法 | 路径 | 请求体 | 响应 | 后端 | 前端 |
|---|------|------|--------|------|------|------|
| 21 | POST | `/apps/:appName/deployments/:depName/release` | **multipart**: `packageInfo` (JSON) + `package` (zip) | `{"msg": "succeed"}` | ✅ Controller | ❌ |
| 22 | PATCH | `/apps/:appName/deployments/:depName/release` | `{ packageInfo: { label?, isDisabled?, rollout? } }` | `""` | ✅ Resolver | ❌ |
| 23 | POST | `/apps/:appName/deployments/:source/promote/:dest` | `{ packageInfo?: {...} }` | `{ package: packages }` | ✅ Resolver | ❌ |
| 24 | POST | `/apps/:appName/deployments/:depName/rollback` | — | `"ok"` | ✅ Resolver | ❌ |
| 25 | POST | `/apps/:appName/deployments/:depName/rollback/:label` | — | `"ok"` | ✅ Resolver | ❌ |

### 2.7 历史记录 & 指标 — [`routes/apps.js`](https://github.com/lisong/code-push-server/blob/v5.7.1/routes/apps.js)

| # | 方法 | 路径 | 响应 | 后端 | 前端 |
|---|------|------|------|------|------|
| 26 | GET | `/apps/:appName/deployments/:depName/history` | `{ history: [...] }` | ✅ Resolver | ❌ |
| 27 | DELETE | `/apps/:appName/deployments/:depName/history` | `"ok"` | ✅ Resolver | ❌ |
| 28 | GET | `/apps/:appName/deployments/:depName/metrics` | `{ metrics: { label: { active, downloaded, failed, installed } } }` | ✅ Resolver | ❌ |

### 2.8 客户端 SDK（不代理） — [`routes/index.js`](https://github.com/lisong/code-push-server/blob/v5.7.1/routes/index.js)

| # | 方法 | 路径 | 参数 | 响应 | 备注 |
|---|------|------|------|------|------|
| 29 | GET | `/updateCheck` | `query: deploymentKey, appVersion, label?, packageHash?, clientUniqueId?` | `{ updateInfo: {...} }` | ⏸️ 客户端直连 |
| 30 | POST | `/reportStatus/download` | `{ deploymentKey, label, clientUniqueId }` | `"OK"` | ⏸️ 客户端直连 |
| 31 | POST | `/reportStatus/deploy` | `{ deploymentKey, label, clientUniqueId, ... }` | `"OK"` | ⏸️ 客户端直连 |
| 32 | GET | `/authenticated` | — | `{ authenticated: true }` | ⏸️ 客户端直连 |

### 2.9 客户端 SDK V1（标准 CodePush API） — [`routes/indexV1.js`](https://github.com/lisong/code-push-server/blob/v5.7.1/routes/indexV1.js)

| # | 方法 | 路径 | 参数 | 响应 | 备注 |
|---|------|------|------|------|------|
| 33 | GET | `/v0.1/public/codepush/update_check` | `query: deployment_key, app_version, ...` | `{ update_info: {...} }` | ⏸️ 客户端直连 |
| 34 | POST | `/v0.1/public/codepush/report_status/download` | `{ deployment_key, label, ... }` | `"OK"` | ⏸️ 客户端直连 |
| 35 | POST | `/v0.1/public/codepush/report_status/deploy` | `{ deployment_key, label, ... }` | `"OK"` | ⏸️ 客户端直连 |

---

## 三、实现状态总览

| 类别 | 端点数 | 后端 Service | 后端 Resolver | 前端 UI |
|------|--------|:---:|:---:|:---:|
| 认证（Auth） | 2 | ✅ | ✅ | ❌ |
| 账户（Account） | 1 | ✅ | ✅ | ❌ |
| 访问密钥（Access Keys） | 3 | ✅ | ✅ | ❌ |
| 应用（Apps） | 8 | ✅ | ✅ | ❌ |
| 部署（Deployments） | 5 | ✅ | ✅ | ❌ |
| 发布（Releases） | 5 | ✅ | ✅ + REST | ❌ |
| 历史/指标 | 3 | ✅ | ✅ | ❌ |
| 上传（multipart） | 1 | ✅ Controller | - | ❌ |
| 客户端 SDK（不代理） | 7 | ⏸️ 不实现 | ⏸️ | ⏸️ |
| **总计** | **35** | **28/28 后端** | **28/28** | **0/28 前端** |

### 后端实现（28/28 — 100% ✅）

所有 28 个管理端 API 已通过以下文件实现：

| 文件 | 行数 | 内容 |
|------|------|------|
| [`backend/src/codepush/codepush.service.ts`](../backend/src/codepush/codepush.service.ts) | ~430 行 | 28 个 HTTP 代理方法 + `forwardMultipart()` + `fetchWithAuth()` |
| [`backend/src/codepush/codepush.resolver.ts`](../backend/src/codepush/codepush.resolver.ts) | ~293 行 | 28 个 GraphQL 端点映射（Query/Mutation），返回 `GraphQLJSON` |
| [`backend/src/codepush/codepush.controller.ts`](../backend/src/codepush/codepush.controller.ts) | ~60 行 | REST 端点 `POST /api/codepush/upload/:serverId/:appName/:deploymentName` |
| [`backend/src/codepush/dto/*.input.ts`](../backend/src/codepush/dto/) | ~80 行 | 7 个 DTO（CreateApp, UpdateApp, CreateDeployment, UpdateDeployment, CreateAccessKey, PromoteRelease, UpdateRelease） |

### 后端修复（已解决）

| Bug | 文件 | 状态 |
|-----|------|:----:|
| Auth 登录路径错误 `/api/sessions` → `/auth/login` | [`servers.service.ts`](../backend/src/servers/servers.service.ts:88) | ✅ 已修复 |
| Auth 请求体 `{ username, password }` → `{ account, password }` | [`servers.service.ts`](../backend/src/servers/servers.service.ts:88) | ✅ 已修复 |
| Auth 响应解析 `{ accessKey }` → `{ status, results: { tokens } }` | [`servers.service.ts`](../backend/src/servers/servers.service.ts:88) | ✅ 已修复 |
| Resolver 缺少返回类型 → 全部加 `@Query(() => Model)` | 4 个 resolver 文件 | ✅ 已修复 |
| `@Controller('api/codepush')` 导致双 `/api/` 前缀 | [`codepush.controller.ts`](../backend/src/codepush/codepush.controller.ts:18) | ✅ 已修复 |
| `@Args()` 缺少 `type: () => TypeName` 导致 GraphQL 报错 | 3 个 resolver 文件 | ✅ 已修复 |
| DTO 缺少 `@InputType()` / `@Field()` 装饰器 | CreateServerInput, UpdateServerInput | ✅ 已修复 |

### 前端实现（0/8 页面 — 0% ❌）

| 页面 | 文件 | UI | 真实数据 | 状态 |
|------|------|:--:|:-------:|:----:|
| ServersPage | [`frontend/.../ServersPage.tsx`](../frontend/src/app/routes/dashboard/ServersPage.tsx) | ✅ 完整 UI | ❌ console.log | 🔜 下一阶段 |
| ServerDetailPage | [`frontend/.../ServerDetailPage.tsx`](../frontend/src/app/routes/dashboard/ServerDetailPage.tsx) | ✅ 完整 UI | ❌ mock 数据 | 🔜 下一阶段 |
| CodePushPage | [`frontend/.../CodePushPage.tsx`](../frontend/src/app/routes/dashboard/CodePushPage.tsx) | ⚠️ 占位 | ❌ | 🔜 下一阶段 |
| AppDetailPage | [`frontend/.../AppDetailPage.tsx`](../frontend/src/app/routes/dashboard/AppDetailPage.tsx) | ✅ 3 个 Tab | ❌ mock 数据 | 🔜 下一阶段 |
| ApiKeysPage | [`frontend/.../ApiKeysPage.tsx`](../frontend/src/app/routes/dashboard/ApiKeysPage.tsx) | ⚠️ 占位 | ❌ | 🔜 下一阶段 |
| AuditLogsPage | [`frontend/.../AuditLogsPage.tsx`](../frontend/src/app/routes/dashboard/AuditLogsPage.tsx) | ⚠️ 占位 | ❌ | 🔜 下一阶段 |
| SettingsPage | [`frontend/.../SettingsPage.tsx`](../frontend/src/app/routes/dashboard/SettingsPage.tsx) | ✅ 完整 UI | ❌ mock + console.log | 🔜 下一阶段 |
| DashboardHome | [`frontend/.../DashboardHome.tsx`](../frontend/src/app/routes/dashboard/DashboardHome.tsx) | ✅ 卡片布局 | ❌ `--` 占位 | 🔜 下一阶段 |

---

## 四、与之前版本的主要差异（重要！）

| 项目 | 之前版本（通用理解） | 实际源码（v5.7.1） |
|------|-------------------|-------------------|
| Auth 端点 | `POST /api/sessions` | `POST /auth/login` |
| Auth 请求体 | `{ username, password }` | `{ account, password }` |
| Auth 响应 | `{ accessKey }` | `{ status, results: { tokens } }` |
| API 前缀 | `/api/` | **无前缀**（直接 `/apps`, `/auth` 等） |
| AccessKey 创建参数 | `{ name }` | `{ createdBy, friendlyName, ttl?, description? }` |
| 发布列表 | `GET .../releases` | `GET .../history` |
| 发布修改 | `PATCH .../releases/:label` | `PATCH .../release`（body 带 label） |
| 应用创建参数 | `{ name, platform? }` | `{ name, os, platform }`（os 和 platform 必填） |
| Rollback 路径 | `POST .../rollback` | `POST .../rollback` 或 `.../rollback/:label` |
| Release 上传响应 | `{ label, hash, ... }` | `{"msg": "succeed"}` |
| 两种 Token | 未识别 | JWT (>64 chars) 和 AccessKey (≤64 chars) |
| Multipart 上传 | `package` (file) + metadata | `packageInfo` (JSON string) + `package` (file) |

---

## 五、下一步路线图

### 当前阶段：前端对接（Frontend Connection）

已在 [`plans/frontend-connect-plan.md`](plans/frontend-connect-plan.md) 中规划了 5 个 Phase：

| Phase | 页面 | 估算行数 | 涉及 GQL 操作 |
|-------|------|---------|-------------|
| Phase 1 | 共享 queries.ts + hooks | ~60 行 | 所有查询定义 |
| Phase 2 | ServersPage + ServerDetailPage | ~120 行 | getServers, createServer, updateServer, deleteServer |
| Phase 3 | CodePushPage + AppDetailPage | ~160 行 | codepushApps, codepushDeployments, releaseHistory, etc. |
| Phase 4 | ApiKeysPage + SettingsPage | ~120 行 | getApiKeys, createApiKey, deleteApiKey, codepushAccessKeys |
| Phase 5 | AuditLogsPage + DashboardHome | ~100 行 | getAuditLogs, codepushAccount, etc. |

### 后续阶段：新功能 UI

| 新功能 | 后端 | 前端需要 | 优先级 |
|--------|------|---------|-------|
| Collaborators 管理 | ✅ 3 个 GQL | 新弹窗/面板 | 低 |
| Release 上传 | ✅ REST Controller | 上传表单 + zip 选择 | 中 |
| Deployment Metrics | ✅ GQL Query | 图表/统计数据 | 低 |
| 登录 CodePush Server | ✅ GQL Mutation | ServersPage 内嵌按钮 | 高（必须先做） |

---

## 六、关键风险

1. **前端连接前必须先能登录 CodePush Server** — ServersPage 需要加「登录 CodePush」按钮，调用 `codepushLogin` mutation
2. **Release 上传必须用 REST + multipart** — 不能走 GraphQL，需前端直接调 `POST /api/codepush/upload/...`
3. **所有 codepush GQL 操作需要 `serverId`** — 前端需要先选服务器，再操作其资源
4. **GraphQLJSON 返回的是动态类型** — 前端需要根据响应结构分别处理，不能强类型化
5. **API 路径无 `/api` 前缀** — 所有 proxy 请求的 path 拼接要注意（已在 CodepushService 中正确处理）
