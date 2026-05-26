# HyperPush — 前端 GQL 对接教程（10 个页面逐页教学）

## 目录

| # | 页面 | 难度 | 后端 GQL 端点 |
|---|------|------|---------------|
| 1 | [LoginPage](#1-loginpage) | ⭐ 入门 | `login`, `me` |
| 2 | [RegisterPage](#2-registerpage) | ⭐ 入门 | `register` |
| 3 | [ServersPage](#3-serverspage) | ⭐⭐ 基础 | `getServers`, `createServer` |
| 4 | [ServerDetailPage](#4-serverdetailpage) | ⭐⭐ 基础 | `server`, `updateServer`, `deleteServer` |
| 5 | [CodePushPage](#5-codepushpage) | ⭐⭐⭐ 进阶 | `codepushApps`, `createCodepushApp` |
| 6 | [AppDetailPage](#6-appdetailpage) | ⭐⭐⭐ 进阶 | `codepushDeployments`, `codepushReleaseHistory`, `codepushAccessKeys`, `codepushDeploymentMetrics` |
| 7 | [ApiKeysPage](#7-apikeyspage) | ⭐⭐ 基础 | `getApiKeys`, `createApiKey`, `deleteApiKey` |
| 8 | [SettingsPage](#8-settingspage) | ⭐⭐ 基础 | `me`, `getApiKeys`, `createApiKey`, `deleteApiKey` |
| 9 | [AuditLogsPage](#9-auditlogspage) | ⭐⭐ 基础 | `getAuditLogs` |
| 10 | [DashboardHome](#10-dashboardhome) | ⭐⭐⭐ 进阶 | 多个 queries 组合 |

---

## 准备工作

### GQL 查询字符串在哪？

所有 GQL query/mutation 已经集中写在 [`frontend/src/app/lib/queries.ts`](../frontend/src/app/lib/queries.ts) 里。

你只需要在页面组件里 import 使用：

```tsx
import { LOGIN_MUTATION } from '@app/lib/queries';
```

### Apollo Client 怎么用？

Apollo Client 已经在 [`frontend/src/app/lib/apollo.ts`](../frontend/src/app/lib/apollo.ts) 配好，自动从 localStorage 读取 JWT token 并加到 header。

在组件里有两种用法：

**方式 A — `useMutation` Hook（推荐，react-hook-form 集成方便）**

```tsx
import { useMutation } from '@apollo/client';
import { LOGIN_MUTATION } from '@app/lib/queries';

const [login, { loading, error }] = useMutation(LOGIN_MUTATION);

const onSubmit = async (data) => {
  const result = await login({
    variables: { input: { email: data.email, password: data.password } },
  });
  // result.data.login.accessToken — backend 返回的是 accessToken
};
```

**方式 B — `client.mutate()` / `client.query()`（不在组件内用）**

```tsx
import { apolloClient } from '@app/lib/apollo';

const result = await apolloClient.mutate({
  mutation: LOGIN_MUTATION,
  variables: { input: { email, password } },
});
```

**方式 C — `useQuery` Hook（用于数据查询）**

```tsx
import { useQuery } from '@apollo/client';
import { GET_SERVERS } from '@app/lib/queries';

const { data, loading, error } = useQuery(GET_SERVERS);
```

### ⚠️ 重要：accessToken vs token 差异

| 层 | 字段名 | 位置 |
|---|--------|------|
| Backend `AuthModel` | `accessToken` | [`backend/src/auth/models/auth.model.ts`](../backend/src/auth/models/auth.model.ts) |
| GraphQL 响应 | `login.accessToken` | 自动生成 |
| Frontend `queries.ts` | 已写 `accessToken` | [`frontend/src/app/lib/queries.ts`](../frontend/src/app/lib/queries.ts) |
| Frontend `AuthResponse` | `token` | [`frontend/src/app/types/auth.ts`](../frontend/src/app/types/auth.ts) |
| Redux `authSuccess` | `token` | [`frontend/src/app/store/slices/authSlice.ts`](../frontend/src/app/store/slices/authSlice.ts) |

**所以 GQL 返回的是 `accessToken`，但 Redux dispatch 需要 `token`**。你需要在代码里做映射：

```tsx
// ✅ 正确做法
dispatch(authSuccess({
  token: result.data.login.accessToken,  // GQL 返回 accessToken
  user: result.data.login.user,
}));
```

---

## 1. LoginPage

**文件**: [`frontend/src/app/routes/LoginPage.tsx`](../frontend/src/app/routes/LoginPage.tsx)
**后端**: `AuthResolver.login()` → [`backend/src/auth/auth.resolver.ts`](../backend/src/auth/auth.resolver.ts)

### 你要写的代码

替换 `onSubmit` 函数里的 mock 代码块（第 50-95 行）。

### Step-by-step

#### Step 1: 导入 useMutation

在文件顶部已有导入，但需要确保有：

```tsx
import { useMutation } from '@apollo/client';
import { LOGIN_MUTATION } from '@app/lib/queries';
```

#### Step 2: 在组件内创建 mutation hook

在 `export function LoginPage()` 里的 `const dispatch` 后面加：

```tsx
const [loginMutation, { loading: loginLoading }] = useMutation(LOGIN_MUTATION);
```

> 🔑 **TIPS**: 
> - `loginMutation` 是执行函数，调用时传 `{ variables }`
> - `loginLoading` 可以替代现有的 `isLoading`（但 Redux 已经有）
> - 也可以直接用 `client.mutate()` 方式，看你习惯

#### Step 3: 替换 onSubmit 的 mock 代码

原来第 50-95 行的 mock 代码替换为：

```tsx
const onSubmit = async (data: LoginFormData) => {
  dispatch(authStart());

  try {
    const result = await loginMutation({
      variables: {
        input: {
          email: data.email,
          password: data.password,
        },
      },
    });

    dispatch(authSuccess({
      token: result.data.login.accessToken,   // ← 注意是 accessToken 不是 token
      user: result.data.login.user,
    }));

    navigate({ to: '/dashboard' });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Login failed, please try again';
    dispatch(authFailure(message));
  }
};
```

#### Step 4: 验证

1. 启动 backend + frontend
2. 打开 http://localhost:5173
3. 输入 email + password，点击 Sign In
4. 成功 → 跳转到 /dashboard，Redux state 里有 token + user
5. 失败 → 显示错误信息

#### Step 5: 启用注册链接（可选）

取消第 153-159 行注释：

```tsx
<p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
  Don't have an account?{' '}
  <a href="/register" className="text-primary-600 hover:text-primary-500">
    Register
  </a>
</p>
```

---

## 2. RegisterPage

**文件**: [`frontend/src/app/routes/RegisterPage.tsx`](../frontend/src/app/routes/RegisterPage.tsx)
**后端**: `AuthResolver.register()` → [`backend/src/auth/auth.resolver.ts`](../backend/src/auth/auth.resolver.ts)

### 你要写的代码

替换 `onSubmit` 函数（第 35-57 行）。

### Step-by-step

#### Step 1: 导入

```tsx
import { useMutation } from '@apollo/client';
import { REGISTER_MUTATION } from '@app/lib/queries';
import { useAppDispatch } from '@app/hooks';
import { authSuccess } from '@app/store/slices/authSlice';
```

> 📌 RegisterPage 目前没有使用 Redux dispatch 和 authSuccess。注册成功后可以选择：
> - **方式 A**: 注册成功 → 自动登录（dispatch authSuccess + 跳 dashboard）
> - **方式 B**: 注册成功 → 跳转登录页让用户手动登录
>
> 推荐 **方式 A**（更流畅的用户体验）。

#### Step 2: 创建 mutation hook

```tsx
const dispatch = useAppDispatch();
const [registerMutation] = useMutation(REGISTER_MUTATION);
```

#### Step 3: 替换 onSubmit

```tsx
const onSubmit = async (data: RegisterFormData) => {
  setError(null);
  setIsLoading(true);

  try {
    const result = await registerMutation({
      variables: {
        input: {
          email: data.email,
          password: data.password,
          name: data.name || undefined,
        },
      },
    });

    // 注册成功 → 自动登录
    dispatch(authSuccess({
      token: result.data.register.accessToken,
      user: result.data.register.user,
    }));

    navigate({ to: '/dashboard' });
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Registration failed');
  } finally {
    setIsLoading(false);
  }
};
```

#### Step 4: 验证

1. 打开 http://localhost:5173/register
2. 填写 Name (optional), Email, Password, Confirm Password
3. 点击 Create Account
4. 成功 → 自动跳转 dashboard，已登录状态

---

## 3. ServersPage

**文件**: [`frontend/src/app/routes/dashboard/ServersPage.tsx`](../frontend/src/app/routes/dashboard/ServersPage.tsx)
**后端**: `ServersResolver.getServers()`, `ServersResolver.createServer()`

### 涉及的后端 GQL

| Mutation/Query | 输入 | 返回 |
|---------------|------|------|
| `getServers` | 无 | `[ServerModel!]!` |
| `createServer` | `CreateServerInput!` | `ServerModel!` |

### ServerModel 字段

```graphql
type ServerModel {
  id: String!
  name: String!
  baseUrl: String!
  username: String!
  isOnline: Boolean!
  userId: String!
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

> 📌 **注意**: `apiKey` 字段不返回给前端。`password` 只在创建时传入，不存储。

### Step-by-step

#### Step 1: 替换空状态的 servers 列表

将第 181-199 行的 `Card padding="none"` 部分改为实际的 servers 列表：

```tsx
import { useQuery, useMutation } from '@apollo/client';
import { GET_SERVERS, CREATE_SERVER } from '@app/lib/queries';
```

在组件内：

```tsx
const { data, loading, error } = useQuery(GET_SERVERS);
const [createServer] = useMutation(CREATE_SERVER, {
  refetchQueries: [{ query: GET_SERVERS }],
});
```

#### Step 2: 渲染 servers 列表

```tsx
<Card padding="none">
  {loading ? (
    <div className="py-16 text-center">
      <p className="text-gray-400">Loading servers...</p>
    </div>
  ) : error ? (
    <div className="py-16 text-center">
      <p className="text-red-400">Error: {error.message}</p>
    </div>
  ) : !data?.getServers?.length ? (
    <div className="py-16 text-center">
      <p className="text-gray-400 dark:text-gray-500">No servers yet</p>
      <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
        Click "Add Server" to connect your first CodePush server.
      </p>
    </div>
  ) : (
    <div className="divide-y divide-gray-100 dark:divide-dark-800">
      {data.getServers.map((server: any) => (
        <div key={server.id} className="flex items-center justify-between px-6 py-4">
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">{server.name}</p>
            <p className="text-sm text-gray-500">{server.baseUrl}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-block h-2 w-2 rounded-full ${server.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
            <Link
              to="/dashboard/servers/$id"
              params={{ id: server.id }}
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              Details
            </Link>
          </div>
        </div>
      ))}
    </div>
  )}
</Card>
```

#### Step 3: 替换 handleSubmit（第 35-40 行）

```tsx
const handleSubmit = async () => {
  try {
    await createServer({
      variables: {
        input: {
          name: form.name,
          baseUrl: form.baseUrl,
          username: form.username,
          password: form.password,
        },
      },
    });
    setOpen(false);
    setForm({ name: '', baseUrl: '', username: '', password: '' });
  } catch (err) {
    console.error('Failed to create server:', err);
  }
};
```

---

## 4. ServerDetailPage

**文件**: [`frontend/src/app/routes/dashboard/ServerDetailPage.tsx`](../frontend/src/app/routes/dashboard/ServerDetailPage.tsx)
**后端**: `ServersResolver.server()`, `ServersResolver.updateServer()`, `ServersResolver.deleteServer()`

### 涉及的后端 GQL

| Query/Mutation | 参数 | 返回 |
|---------------|------|------|
| `server(id: String!)` | `id` | `ServerModel!` |
| `updateServer(input: UpdateServerInput!)` | `{ id, name?, baseUrl?, username?, password? }` | `ServerModel!` |
| `deleteServer(id: String!)` | `id` | `Boolean!` |

### Step-by-step

#### Step 1: 导入 GQL

```tsx
import { useQuery, useMutation } from '@apollo/client';
import { GET_SERVER, UPDATE_SERVER, DELETE_SERVER } from '@app/lib/queries';
```

#### Step 2: 替换 mockServer 和 useQuery

删除第 37-47 行的 `mockServer` 定义。在组件内：

```tsx
const { data, loading, error } = useQuery(GET_SERVER, {
  variables: { id: params.id },
});

const [updateServer] = useMutation(UPDATE_SERVER, {
  refetchQueries: [{ query: GET_SERVER, variables: { id: params.id } }],
});

const [deleteServerMutation] = useMutation(DELETE_SERVER);

const server = data?.server;
```

#### Step 3: 添加 loading/error 处理

在 return 之前：

```tsx
if (loading) return <div className="py-16 text-center text-gray-400">Loading...</div>;
if (error) return <div className="py-16 text-center text-red-400">Error: {error.message}</div>;
if (!server) return <div className="py-16 text-center text-gray-400">Server not found</div>;
```

#### Step 4: 替换 mockServer 引用

把所有的 `mockServer.xxx` 改为 `server.xxx`。

#### Step 5: 替换 handleSave（第 70-74 行）

```tsx
const handleSave = async () => {
  try {
    await updateServer({
      variables: {
        input: {
          id: params.id,
          name: editForm.name,
          baseUrl: editForm.baseUrl,
          username: editForm.username,
        },
      },
    });
    setIsEditing(false);
  } catch (err) {
    console.error('Failed to update server:', err);
  }
};
```

#### Step 6: 替换 handleDelete（第 76-81 行）

```tsx
const handleDelete = async () => {
  try {
    await deleteServerMutation({
      variables: { id: params.id },
    });
    setShowDeleteDialog(false);
    navigate({ to: '/dashboard/servers' });
  } catch (err) {
    console.error('Failed to delete server:', err);
  }
};
```

#### Step 7: 替换 handleResetToken（第 83-88 行）

```tsx
const handleResetToken = async () => {
  try {
    await updateServer({
      variables: {
        input: {
          id: params.id,
          password: resetPassword,
        },
      },
    });
    setShowResetTokenDialog(false);
    setResetPassword('');
  } catch (err) {
    console.error('Failed to reset token:', err);
  }
};
```

> **Connection History 部分**: 目前是 mock 数据（第 49-55 行）。后端没有专门的 connection history API，这部分可以：
> - 暂时保留 mock
> - 或者移除，等以后有实际数据再实现

---

## 5. CodePushPage

**文件**: [`frontend/src/app/routes/dashboard/CodePushPage.tsx`](../frontend/src/app/routes/dashboard/CodePushPage.tsx)
**后端**: `CodepushResolver.codepushApps()`, `CodepushResolver.createCodepushApp()`, `CodepushResolver.deleteCodepushApp()`

### 关键概念：CodePush 数据是 JSON 标量

所有 CodePush proxy API 返回 `GraphQLJSON` 标量（不是 typed model）。这是因为 CodePush server 的数据结构由上游决定，我们直接透传。

### 涉及的后端 GQL

| Query/Mutation | 参数 | 返回 |
|---------------|------|------|
| `codepushApps(serverId: String!)` | `serverId` | `JSON!` |
| `createCodepushApp(input: CreateAppInput!)` | `{ appName, platform, ... }` | `JSON!` |
| `deleteCodepushApp(serverId: String!, appName: String!)` | `serverId, appName` | `JSON!` |

### Step-by-step

#### Step 1: 选择服务器（前提）

CodePush 的数据是按 `serverId` 查询的。所以页面需要：
1. 先加载所有 servers（用 `GET_SERVERS`）
2. 用户选择一个 server
3. 再加载该 server 的 apps

#### Step 2: 查询 servers + apps

```tsx
import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_SERVERS, GET_CODEPUSH_APPS, CREATE_CODEPUSH_APP, DELETE_CODEPUSH_APP } from '@app/lib/queries';
```

```tsx
const [selectedServerId, setSelectedServerId] = useState<string>('');

const serversQuery = useQuery(GET_SERVERS);
const appsQuery = useQuery(GET_CODEPUSH_APPS, {
  variables: { serverId: selectedServerId },
  skip: !selectedServerId,
});
```

#### Step 3: 渲染 apps 列表

```tsx
<Card padding="none">
  {/* Server Selector */}
  <div className="border-b border-gray-200 px-6 py-4 dark:border-dark-700">
    <select
      value={selectedServerId}
      onChange={(e) => setSelectedServerId(e.target.value)}
      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-800 dark:text-gray-100"
    >
      <option value="">Select a server...</option>
      {serversQuery.data?.getServers?.map((s: any) => (
        <option key={s.id} value={s.id}>{s.name}</option>
      ))}
    </select>
  </div>

  {/* Apps List */}
  {!selectedServerId ? (
    <div className="py-16 text-center">
      <p className="text-gray-400">Select a server to view apps</p>
    </div>
  ) : appsQuery.loading ? (
    <div className="py-16 text-center text-gray-400">Loading apps...</div>
  ) : appsQuery.error ? (
    <div className="py-16 text-center text-red-400">Error: {appsQuery.error.message}</div>
  ) : !appsQuery.data?.codepushApps?.length ? (
    <div className="py-16 text-center">
      <p className="text-gray-400">No CodePush apps on this server</p>
    </div>
  ) : (
    <div className="divide-y divide-gray-100 dark:divide-dark-800">
      {appsQuery.data.codepushApps.map((app: any) => (
        <div key={app.name} className="flex items-center justify-between px-6 py-4">
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">{app.name}</p>
            <p className="text-sm text-gray-500">
              {app.os ?? 'N/A'} · {app.collaborators?.length ?? 0} collaborators
            </p>
          </div>
          <Link
            to="/dashboard/codepush/$appId"
            params={{ appId: app.name }}
            search={{ serverId: selectedServerId }}
            className="text-sm text-primary-600 hover:text-primary-500"
          >
            Details
          </Link>
        </div>
      ))}
    </div>
  )}
</Card>
```

> 📌 **一点说明**: CodePush server 返回的 app 数据可能长这样：
> ```json
> [
>   { "name": "MyApp", "os": "ios", "collaborators": [{"email":"admin@example.com"}] }
> ]
> ```
> 因为是 `JSON` 类型，你需要在代码里 `.map((app: any) => ...)` 处理。建议了解上游返回的数据结构后，可以自己写一个简单的 interface。

---

## 6. AppDetailPage

**文件**: [`frontend/src/app/routes/dashboard/AppDetailPage.tsx`](../frontend/src/app/routes/dashboard/AppDetailPage.tsx)
**后端**: Deployments, Releases, Access Keys — 全部返回 `JSON`

### 涉及的后端 GQL

| Query/Mutation | 参数 | 返回 |
|---------------|------|------|
| `codepushDeployments(serverId: String!, appName: String!)` | `serverId, appName` | `JSON!` |
| `codepushReleaseHistory(serverId: String!, appName: String!, deploymentName: String!)` | `serverId, appName, deploymentName` | `JSON!` |
| `codepushAccessKeys(serverId: String!)` | `serverId` | `JSON!` |
| `codepushDeploymentMetrics(serverId: String!, appName: String!, deploymentName: String!)` | `serverId, appName, deploymentName` | `JSON!` |

### 关键差异

AppDetailPage 目前用 `params.appId` 作为路由参数。但 CodePush server 的 API 使用 `appName` 作为标识。你需要：

1. 从路由跳转时传入 `serverId`（通过 `search` 参数，或从 context 获取）
2. 用 `appName`（就是 CodePush 里的 app name）去查询 deployments/releases

### 路由传递

目前路由定义在 [`frontend/src/app/routes/dashboard/app-detail.tsx`](../frontend/src/app/routes/dashboard/app-detail.tsx)，需要支持 `search` 参数传递 `serverId`。

### Step-by-step

#### Step 1: 导入 useQuery + queries

```tsx
import { useQuery } from '@apollo/client';
import {
  GET_CODEPUSH_DEPLOYMENTS,
  GET_CODEPUSH_RELEASE_HISTORY,
  GET_CODEPUSH_ACCESS_KEYS,
} from '@app/lib/queries';
```

#### Step 2: 读取 serverId（从 search params 或 state）

```tsx
// 方式一：从 search params
const search = useSearch({ from: '/dashboard/codepush/$appId' });
const serverId = search.serverId;

// 方式二：从 context（如果有）
// 或者从 store 里拿当前选中的 server

const appName = params.appId; // appId 就是 appName
```

#### Step 3: 替换三个 tab 的 query

```tsx
const deploymentsQuery = useQuery(GET_CODEPUSH_DEPLOYMENTS, {
  variables: { serverId, appName },
  skip: !serverId || !appName,
});

const [selectedDeployment, setSelectedDeployment] = useState<string>('');

const releasesQuery = useQuery(GET_CODEPUSH_RELEASE_HISTORY, {
  variables: { serverId, appName, deploymentName: selectedDeployment },
  skip: !selectedDeployment,
});

const accessKeysQuery = useQuery(GET_CODEPUSH_ACCESS_KEYS, {
  variables: { serverId },
  skip: !serverId,
});
```

#### Step 4: 替换 mockDeployments → data

把 `mockDeployments` 替换为 `deploymentsQuery.data?.codepushDeployments ?? []`。

> 📌 **注意**: CodePush API 返回的 deployment 数据结构通常是：
> ```json
> [
>   { "name": "Staging", "package": { "appVersion": "1.0.0", ... } },
>   { "name": "Production", "package": { ... } }
> ]
> ```
> 你需要查看实际返回的数据来调整渲染逻辑。

---

## 7. ApiKeysPage

**文件**: [`frontend/src/app/routes/dashboard/ApiKeysPage.tsx`](../frontend/src/app/routes/dashboard/ApiKeysPage.tsx)
**后端**: `ApiKeysResolver.getApiKeys()`, `ApiKeysResolver.createApiKey()`, `ApiKeysResolver.deleteApiKey()`

### 涉及的后端 GQL

| Query/Mutation | 参数 | 返回 |
|---------------|------|------|
| `getApiKeys` | 无 | `[ApiKeyModel!]!` |
| `createApiKey(input: CreateApiKeyInput!)` | `{ name }` | `ApiKeyModel!` |
| `deleteApiKey(id: String!)` | `id` | `Boolean!` |

### ApiKeyModel 字段

```graphql
type ApiKeyModel {
  id: String!
  name: String!
  key: String!
  userId: String!
  createdAt: DateTime!
}
```

### Step-by-step

#### Step 1: 导入 + useQuery

```tsx
import { useQuery, useMutation } from '@apollo/client';
import { GET_API_KEYS, CREATE_API_KEY, DELETE_API_KEY } from '@app/lib/queries';
import { useState } from 'react';
```

#### Step 2: 替换空状态

```tsx
export function ApiKeysPage() {
  const { data, loading, error } = useQuery(GET_API_KEYS);
  const [createApiKey] = useMutation(CREATE_API_KEY, {
    refetchQueries: [{ query: GET_API_KEYS }],
  });
  const [deleteApiKeyMutation] = useMutation(DELETE_API_KEY, {
    refetchQueries: [{ query: GET_API_KEYS }],
  });
  const [newKeyName, setNewKeyName] = useState('');

  const handleCreate = async () => {
    try {
      await createApiKey({ variables: { input: { name: newKeyName } } });
      setNewKeyName('');
      setShowCreateDialog(false);
    } catch (err) {
      console.error('Failed to create API key:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteApiKeyMutation({ variables: { id } });
    } catch (err) {
      console.error('Failed to delete API key:', err);
    }
  };

  const apiKeys = data?.getApiKeys ?? [];
```

#### Step 3: 渲染 keys 列表

用 `apiKeys` 替换 mock 数据结构，参考 SettingsPage 的渲染方式（显示 name, key, created date, delete button）。

---

## 8. SettingsPage

**文件**: [`frontend/src/app/routes/dashboard/SettingsPage.tsx`](../frontend/src/app/routes/dashboard/SettingsPage.tsx)
**后端**: `AuthResolver.me()`, `ApiKeysResolver.*`

### 涉及的后端 GQL

| Query/Mutation | 参数 | 返回 |
|---------------|------|------|
| `me` | 无 | `UserModel!` |
| `getApiKeys` | 无 | `[ApiKeyModel!]!` |
| `createApiKey(input: CreateApiKeyInput!)` | `{ name }` | `ApiKeyModel!` |
| `deleteApiKey(id: String!)` | `id` | `Boolean!` |

### Step-by-step

**Profile 部分**: 已经使用 Redux state 的 `user`，不需要改（登录时已经保存）。

**API Keys 部分**: 替换 mockApiKeys（第 49-66 行）+ 对话框逻辑（同上 ApiKeysPage）。

---

## 9. AuditLogsPage

**文件**: [`frontend/src/app/routes/dashboard/AuditLogsPage.tsx`](../frontend/src/app/routes/dashboard/AuditLogsPage.tsx)
**后端**: `AuditLogResolver.getAuditLogs()`

### 涉及的后端 GQL

| Query | 参数 | 返回 |
|-------|------|------|
| `getAuditLogs(filter: AuditLogFilterInput)` | `{ entity?, action? }` | `[AuditLogModel!]!` |

### AuditLogModel 字段

```graphql
type AuditLogModel {
  id: String!
  action: String!
  entity: String!
  entityId: String
  detail: String
  userId: String!
  createdAt: DateTime!
}
```

### Step-by-step

```tsx
import { useQuery } from '@apollo/client';
import { GET_AUDIT_LOGS } from '@app/lib/queries';
```

```tsx
export function AuditLogsPage() {
  const { data, loading, error } = useQuery(GET_AUDIT_LOGS, {
    variables: { filter: undefined },
  });

  const logs = data?.getAuditLogs ?? [];
```

渲染 logs 为表格，显示 `action`, `entity`, `detail`, `createdAt` 等字段。

---

## 10. DashboardHome

**文件**: [`frontend/src/app/routes/dashboard/DashboardHome.tsx`](../frontend/src/app/routes/dashboard/DashboardHome.tsx)
**后端**: 需要组合多个查询

### 需要展示的统计数据

| 指标 | 查询来源 | GQL |
|------|---------|-----|
| Servers 数量 | `getServers` | `GET_SERVERS` |
| API Keys 数量 | `getApiKeys` | `GET_API_KEYS` |
| Audit Logs 数量 | `getAuditLogs` | `GET_AUDIT_LOGS` |
| CodePush Apps 数量 | `codepushApps(serverId)` | `GET_CODEPUSH_APPS` |

### 方案一：Apollo 多个 useQuery

```tsx
import { useQuery } from '@apollo/client';
import { GET_SERVERS, GET_API_KEYS, GET_AUDIT_LOGS } from '@app/lib/queries';

export function DashboardHome() {
  const serversQuery = useQuery(GET_SERVERS);
  const apiKeysQuery = useQuery(GET_API_KEYS);
  const auditLogsQuery = useQuery(GET_AUDIT_LOGS, {
    variables: { filter: undefined },
  });

  const stats = [
    { title: 'Servers', value: serversQuery.data?.getServers?.length ?? '--', icon: Server, color: 'text-blue-600' },
    { title: 'API Keys', value: apiKeysQuery.data?.getApiKeys?.length ?? '--', icon: KeyRound, color: 'text-green-600' },
    { title: 'Audit Logs', value: auditLogsQuery.data?.getAuditLogs?.length ?? '--', icon: ScrollText, color: 'text-purple-600' },
    { title: 'CodePush Apps', value: '--', icon: Cloud, color: 'text-orange-600' }, // 需要选 server 才能查询
  ];
```

### 方案二：合并成一个 hook（进阶）

如果多个并行 query 让代码太乱，可以创建自定义 hook：

```tsx
// frontend/src/app/hooks/useDashboardStats.ts
export function useDashboardStats() {
  const servers = useQuery(GET_SERVERS);
  const apiKeys = useQuery(GET_API_KEYS);
  const auditLogs = useQuery(GET_AUDIT_LOGS, { variables: { filter: undefined } });

  return {
    stats: [
      { label: 'Servers', count: servers.data?.getServers?.length ?? 0 },
      { label: 'API Keys', count: apiKeys.data?.getApiKeys?.length ?? 0 },
      { label: 'Audit Logs', count: auditLogs.data?.getAuditLogs?.length ?? 0 },
    ],
    loading: servers.loading || apiKeys.loading || auditLogs.loading,
    error: servers.error ?? apiKeys.error ?? auditLogs.error,
  };
}
```

---

## 附录 A：完整 GQL Schema（自动生成）

启动 backend 后，访问 http://localhost:3000/graphql 可以看到完整的 Schema。

关键类型一览：

```graphql
type Query {
  me: UserModel!
  getServers: [ServerModel!]!
  server(id: String!): ServerModel
  getApiKeys: [ApiKeyModel!]!
  getAuditLogs(filter: AuditLogFilterInput): [AuditLogModel!]!
  
  # CodePush (全部返回 JSON)
  codepushLogin(serverId: String!, account: String!, password: String!): JSON!
  codepushLogout(serverId: String!): JSON!
  codepushAccount(serverId: String!): JSON!
  codepushAccessKeys(serverId: String!): JSON!
  codepushApps(serverId: String!): JSON!
  codepushDeployments(serverId: String!, appName: String!): JSON!
  codepushDeployment(serverId: String!, appName: String!, deploymentName: String!): JSON!
  codepushReleaseHistory(serverId: String!, appName: String!, deploymentName: String!): JSON!
  codepushDeploymentMetrics(serverId: String!, appName: String!, deploymentName: String!): JSON!
  codepushCollaborators(serverId: String!, appName: String!): JSON!
}

type Mutation {
  login(input: LoginInput!): AuthModel!
  register(input: RegisterInput!): AuthModel!
  createServer(input: CreateServerInput!): ServerModel!
  updateServer(input: UpdateServerInput!): ServerModel!
  deleteServer(id: String!): Boolean!
  createApiKey(input: CreateApiKeyInput!): ApiKeyModel!
  deleteApiKey(id: String!): Boolean!
  createAuditLog(action: String!, entity: String!, entityId: String, detail: String): AuditLogModel!
  
  # CodePush (全部返回 JSON)
  createCodepushAccessKey(input: CreateAccessKeyInput!): JSON!
  deleteCodepushAccessKey(serverId: String!, name: String!): JSON!
  createCodepushApp(input: CreateAppInput!): JSON!
  updateCodepushApp(serverId: String!, appName: String!, input: UpdateAppInput!): JSON!
  deleteCodepushApp(serverId: String!, appName: String!): JSON!
  transferCodepushApp(serverId: String!, appName: String!, email: String!): JSON!
  addCodepushCollaborator(serverId: String!, appName: String!, email: String!): JSON!
  removeCodepushCollaborator(serverId: String!, appName: String!, email: String!): JSON!
  createCodepushDeployment(input: CreateDeploymentInput!): JSON!
  updateCodepushDeployment(serverId: String!, appName: String!, deploymentName: String!, input: UpdateDeploymentInput!): JSON!
  deleteCodepushDeployment(serverId: String!, appName: String!, deploymentName: String!): JSON!
  updateCodepushRelease(input: UpdateReleaseInput!): JSON!
  promoteCodepushRelease(input: PromoteReleaseInput!): JSON!
  rollbackCodepushRelease(serverId: String!, appName: String!, deploymentName: String!): JSON!
  clearCodepushDeploymentHistory(serverId: String!, appName: String!, deploymentName: String!): JSON!
}
```

## 附录 B：常见问题

### Q: 为什么 CodePush API 返回 JSON 而不是 typed model？

因为 CodePush server 的数据结构由上游（lisong/code-push-server）定义，我们不控制它的 schema。BFF 层直接透传，前端拿到后自己解析。你可以写一个 helper function 来转换：

```tsx
interface CodePushApp {
  name: string;
  os: string;
  collaborators: Array<{ email: string }>;
  deployments: string[];
}

function parseApps(raw: any): CodePushApp[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((app: any) => ({
    name: app.name,
    os: app.os ?? app.platform,
    collaborators: app.collaborators ?? [],
    deployments: app.deployments ?? [],
  }));
}
```

### Q: 在 AppDetailPage 怎么获取 serverId？

有三种方式：

1. **Search params**: 从 CodePushPage 跳转时带 `?serverId=xxx`
2. **Context**: 在 DashboardLayout 维护一个 "当前选中的 server"
3. **Redux store**: 存一个 `activeServerId` 在 Redux 里

推荐方式 1，最简单。

### Q: `accessToken` vs `token` 怎么处理？

在 dispatch 到 Redux 时做映射：

```tsx
// GraphQL 返回 { login: { accessToken, user } }
// Redux 需要 { token, user }
dispatch(authSuccess({
  token: result.data.login.accessToken,
  user: result.data.login.user,
}));
```

---

## 建议学习顺序

按依赖关系排列，建议依次对接：

```
LoginPage → RegisterPage（认证基础）
    ↓
ServersPage → ServerDetailPage（需要登录）
    ↓
ApiKeysPage → SettingsPage（简单 CRUD）
    ↓
AuditLogsPage（简单查询）
    ↓
CodePushPage → AppDetailPage（复杂 JSON 解析）
    ↓
DashboardHome（多查询组合）
```

每个页面完成后都验证一次，确保 build 通过、功能正常。
