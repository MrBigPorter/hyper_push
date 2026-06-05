# 📡 GraphQL API Reference

HyperPush exposes a **code-first GraphQL API** via Apollo Server 5. The schema is auto-generated from NestJS decorators and written to [`schema.gql`](/backend/schema.gql).

**Endpoint**: `/graphql`  
**Production Introspection**: Disabled (`NODE_ENV=production`)

---

## 🔐 Authentication

Most queries and mutations require authentication via JWT Bearer token.

**Header**:
```
Authorization: Bearer <accessToken>
```

**Flow**:
1. Call `register` or `login` → get `accessToken`
2. Include `accessToken` in all subsequent requests via `Authorization` header
3. Optional: if 2FA is enabled, login returns `tempToken` → call `verify2fa` → get `accessToken`

---

## 📋 Data Models

### User

```graphql
type User {
  id: ID!
  username: String!
  email: String!
  name: String!
  role: String!             # "admin" | "user"
  totpEnabled: Boolean!
  loginAttempts: Int!
  lockoutUntil: DateTime
  bannedAt: DateTime
  banReason: String
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

### Auth

```graphql
type Auth {
  accessToken: String!
  user: User!
}

type TempAuth {
  tempToken: String!
  user: User!
}
```

### Server

```graphql
type Server {
  id: ID!
  name: String!
  baseUrl: String!
  username: String!
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

### ApiKey

```graphql
type ApiKey {
  id: ID!
  prefix: String!
  name: String!
  expiresAt: DateTime
  lastUsedAt: DateTime
  createdAt: DateTime!
}
```

### CodePush Types

```graphql
type AccessKey {
  name: String!
  createdTime: DateTime!
  createdBy: String!
  description: String!
}

type App {
  name: String!
  os: String!
  platform: String!
  deployments: [Deployment!]
  collaborators: [Collaborator!]
}

type Deployment {
  name: String!
  package: Release
}

type Release {
  appVersion: String!
  description: String!
  label: String!
  mandatory: Boolean!
  originalDeployment: String!
  originalLabel: String!
  releasedBy: String!
  releaseMethod: String!
  rollout: Int!
  size: Int!
  uploadTime: DateTime!
}

type Collaborator {
  email: String!
  permissions: String!
}

type DeploymentMetric {
  name: String!
  value: Int!
  label: String!
}

type DeploymentMetrics {
  deploymentName: String!
  metrics: [DeploymentMetric!]!
}
```

### AuditLog

```graphql
type AuditLog {
  id: ID!
  action: String!
  entity: String!
  entityId: String
  detail: String
  userId: String!
  ip: String
  createdAt: DateTime!
}
```

### Pagination

```graphql
type PaginatedUsers {
  items: [User!]!
  total: Int!
  page: Int!
  pageSize: Int!
}

type AuditLogListResponse {
  items: [AuditLog!]!
  total: Int!
  page: Int!
  pageSize: Int!
}
```

---

## ⚡ Queries

### `me` — Get current user

```graphql
query Me {
  me {
    id
    username
    email
    name
    role
    totpEnabled
    createdAt
  }
}
```

### `listUsers` — List all users (admin only)

```graphql
query ListUsers($page: Int, $pageSize: Int, $search: String) {
  listUsers(options: { page: $page, pageSize: $pageSize, search: $search }) {
    items {
      id
      username
      email
      name
      role
      totpEnabled
      bannedAt
      banReason
      createdAt
    }
    total
    page
    pageSize
  }
}
```

### `servers` — List all CodePush servers

```graphql
query Servers {
  servers {
    id
    name
    baseUrl
    username
    createdAt
  }
}
```

### `server` — Get single server

```graphql
query Server($id: ID!) {
  server(id: $id) {
    id
    name
    baseUrl
    username
    createdAt
  }
}
```

### `apiKeys` — List API keys

```graphql
query ApiKeys {
  apiKeys {
    id
    prefix
    name
    expiresAt
    lastUsedAt
    createdAt
  }
}
```

### `getAuditLogs` — Query audit logs

```graphql
query GetAuditLogs($filter: AuditLogFilterInput, $page: Int, $pageSize: Int) {
  getAuditLogs(filter: $filter, page: $page, pageSize: $pageSize) {
    items {
      id
      action
      entity
      entityId
      detail
      userId
      ip
      createdAt
    }
    total
    page
    pageSize
  }
}

# Filter input:
# input AuditLogFilterInput {
#   userId: String
#   action: String
#   entity: String
#   startDate: DateTime
#   endDate: DateTime
# }
```

### CodePush Queries

```graphql
# List access keys for a server
query CodepushAccessKeys($serverId: String!) {
  codepushAccessKeys(serverId: $serverId) {
    name
    createdTime
    createdBy
    description
  }
}

# List apps for a server
query CodepushApps($serverId: String!) {
  codepushApps(serverId: $serverId) {
    name
    os
    platform
    deployments {
      name
      package {
        appVersion
        label
        description
        mandatory
        size
        uploadTime
      }
    }
    collaborators {
      email
      permissions
    }
  }
}

# Get release history for a deployment
query CodepushReleaseHistory(
  $serverId: String!
  $appName: String!
  $deploymentName: String!
) {
  codepushReleaseHistory(
    serverId: $serverId
    appName: $appName
    deploymentName: $deploymentName
  ) {
    appVersion
    label
    description
    mandatory
    size
    uploadTime
    releasedBy
    rollout
  }
}

# Get deployment metrics
query CodepushDeploymentMetrics(
  $serverId: String!
  $appName: String!
  $deploymentName: String!
) {
  codepushDeploymentMetrics(
    serverId: $serverId
    appName: $appName
    deploymentName: $deploymentName
  ) {
    deploymentName
    metrics {
      name
      value
      label
    }
  }
}

# List deployments for an app
query CodepushDeployments($serverId: String!, $appName: String!) {
  codepushDeployments(serverId: $serverId, appName: $appName) {
    name
    package {
      appVersion
      label
      description
      mandatory
    }
  }
}
```

---

## ✍️ Mutations

### Authentication

#### `register` — Create account

```graphql
mutation Register($input: RegisterInput!) {
  register(input: $input) {
    accessToken
    user {
      id
      username
      email
      name
      role
    }
  }
}

# input RegisterInput {
#   username: String!
#   email: String!
#   password: String!
#   name: String!
#   recaptchaToken: String   # Optional, for reCAPTCHA v3
# }
```

#### `login` — Sign in

```graphql
mutation Login($input: LoginInput!) {
  login(input: $input) {
    ... on Auth {
      accessToken
      user { id username email name role totpEnabled }
    }
    ... on TempAuth {
      tempToken
      user { id username email name role totpEnabled }
    }
  }
}

# Returns Auth (no 2FA) or TempAuth (2FA required)
# input LoginInput {
#   username: String!
#   password: String!
#   recaptchaToken: String   # Optional
# }
```

#### `verify2fa` — Complete 2FA login

```graphql
mutation Verify2fa($input: Verify2faInput!) {
  verify2fa(input: $input) {
    accessToken
    user { id username email name role totpEnabled }
  }
}

# input Verify2faInput {
#   tempToken: String!
#   totpToken: String!
# }
```

### User Management

#### `changePassword` — Change password

```graphql
mutation ChangePassword($input: ChangePasswordInput!) {
  changePassword(input: $input) {
    id
    username
    email
  }
}

# input ChangePasswordInput {
#   currentPassword: String!
#   newPassword: String!
#   totpToken: String       # Required if 2FA is enabled
# }
```

#### `updateUser` — Update profile

```graphql
mutation UpdateUser($input: UpdateUserInput!) {
  updateUser(input: $input) {
    id
    username
    email
    name
  }
}

# input UpdateUserInput {
#   name: String
#   email: String
# }
```

#### `banUser` — Ban user (admin only)

```graphql
mutation BanUser($userId: ID!, $reason: String) {
  banUser(userId: $userId, reason: $reason) {
    id
    username
    bannedAt
    banReason
  }
}
```

#### `unbanUser` — Unban user (admin only)

```graphql
mutation UnbanUser($userId: ID!) {
  unbanUser(userId: $userId) {
    id
    username
    bannedAt
  }
}
```

### Two-Factor Authentication

#### `setup2fa` — Get TOTP secret

```graphql
mutation Setup2fa {
  setup2fa {
    secret
    uri
  }
}
```

#### `enable2fa` — Enable 2FA

```graphql
mutation Enable2fa($token: String!) {
  enable2fa(token: $token)
}
```

#### `disable2fa` — Disable 2FA

```graphql
mutation Disable2fa($password: String!, $totpToken: String) {
  disable2fa(password: $password, totpToken: $totpToken)
}
```

### Server Management

#### `createServer` — Add CodePush server

```graphql
mutation CreateServer($input: CreateServerInput!) {
  createServer(input: $input) {
    id
    name
    baseUrl
    username
  }
}

# input CreateServerInput {
#   name: String!
#   baseUrl: String!
#   username: String!
#   password: String!
# }
```

#### `updateServer` — Update server

```graphql
mutation UpdateServer($input: UpdateServerInput!) {
  updateServer(input: $input) {
    id
    name
    baseUrl
    username
  }
}

# input UpdateServerInput {
#   id: ID!
#   name: String
#   baseUrl: String
#   username: String
#   password: String
# }
```

#### `deleteServer` — Remove server

```graphql
mutation DeleteServer($id: ID!) {
  deleteServer(id: $id)
}
```

### API Key Management

#### `createApiKey` — Generate API key

```graphql
mutation CreateApiKey($input: CreateApiKeyInput!) {
  createApiKey(input: $input) {
    id
    prefix
    name
    key         # ⚠️ Full key shown only once on creation
    expiresAt
  }
}

# input CreateApiKeyInput {
#   name: String!
#   expiresAt: DateTime    # Optional
# }
```

#### `deleteApiKey` — Revoke API key

```graphql
mutation DeleteApiKey($id: ID!) {
  deleteApiKey(id: $id)
}
```

### CodePush Mutations

```graphql
# Login to CodePush server
mutation CodepushLogin($serverId: String!, $account: String!, $password: String!) {
  codepushLogin(serverId: $serverId, account: $account, password: $password)
}

# Create access key
mutation CreateCodepushAccessKey($input: CreateAccessKeyInput!) {
  createCodepushAccessKey(input: $input) {
    name
    createdTime
    createdBy
    description
  }
}

# Delete access key
mutation DeleteCodepushAccessKey($serverId: String!, $name: String!) {
  deleteCodepushAccessKey(serverId: $serverId, name: $name)
}

# Create app
mutation CreateCodepushApp($input: CreateAppInput!) {
  createCodepushApp(input: $input) {
    name
    os
    platform
    deployments { name }
  }
}

# Update app
mutation UpdateCodepushApp($input: UpdateAppInput!) {
  updateCodepushApp(input: $input) {
    name
    os
    platform
  }
}

# Delete app
mutation DeleteCodepushApp($serverId: String!, $appName: String!) {
  deleteCodepushApp(serverId: $serverId, appName: $appName)
}

# Transfer app to another user
mutation TransferCodepushApp($serverId: String!, $appName: String!, $email: String!) {
  transferCodepushApp(serverId: $serverId, appName: $appName, email: $email)
}

# Create deployment
mutation CreateCodepushDeployment($input: CreateDeploymentInput!) {
  createCodepushDeployment(input: $input) {
    name
  }
}

# Update deployment
mutation UpdateCodepushDeployment($input: UpdateDeploymentInput!) {
  updateCodepushDeployment(input: $input) {
    name
  }
}

# Delete deployment
mutation DeleteCodepushDeployment($serverId: String!, $appName: String!, $deploymentName: String!) {
  deleteCodepushDeployment(serverId: $serverId, appName: $appName, deploymentName: $deploymentName)
}

# Release update
mutation CodepushRelease($input: UpdateReleaseInput!) {
  codepushRelease(input: $input) {
    appVersion
    description
    label
    mandatory
    size
    uploadTime
  }
}

# Promote release between deployments
mutation PromoteCodepushRelease($input: PromoteReleaseInput!) {
  promoteCodepushRelease(input: $input) {
    appVersion
    description
    label
    mandatory
    size
    uploadTime
  }
}

# Rollback deployment
mutation RollbackCodepushRelease($serverId: String!, $appName: String!, $deploymentName: String!) {
  rollbackCodepushRelease(serverId: $serverId, appName: $appName, deploymentName: $deploymentName)
}

# Rollback to specific label
mutation RollbackCodepushToLabel($serverId: String!, $appName: String!, $deploymentName: String!, $label: String!) {
  rollbackCodepushToLabel(serverId: $serverId, appName: $appName, deploymentName: $deploymentName, label: $label)
}

# Clear deployment history
mutation ClearCodepushDeploymentHistory($serverId: String!, $appName: String!, $deploymentName: String!) {
  clearCodepushDeploymentHistory(serverId: $serverId, appName: $appName, deploymentName: $deploymentName)
}
```

---

## 🧩 Input Types Reference

| Input Type | Fields |
|------------|--------|
| `RegisterInput` | `username: String!`, `email: String!`, `password: String!`, `name: String!`, `recaptchaToken: String` |
| `LoginInput` | `username: String!`, `password: String!`, `recaptchaToken: String` |
| `Verify2faInput` | `tempToken: String!`, `totpToken: String!` |
| `ChangePasswordInput` | `currentPassword: String!`, `newPassword: String!`, `totpToken: String` |
| `UpdateUserInput` | `name: String`, `email: String` |
| `CreateServerInput` | `name: String!`, `baseUrl: String!`, `username: String!`, `password: String!` |
| `UpdateServerInput` | `id: ID!`, `name: String`, `baseUrl: String`, `username: String`, `password: String` |
| `CreateApiKeyInput` | `name: String!`, `expiresAt: DateTime` |
| `AuditLogFilterInput` | `userId: String`, `action: String`, `entity: String`, `startDate: DateTime`, `endDate: DateTime` |
| `CreateAccessKeyInput` | `serverId: String!`, `name: String!`, `description: String` |
| `CreateAppInput` | `serverId: String!`, `name: String!`, `os: String!`, `platform: String!` |
| `UpdateAppInput` | `serverId: String!`, `appName: String!`, `newName: String!` |
| `CreateDeploymentInput` | `serverId: String!`, `appName: String!`, `name: String!` |
| `UpdateDeploymentInput` | `serverId: String!`, `appName: String!`, `deploymentName: String!`, `newName: String!` |
| `UpdateReleaseInput` | `serverId: String!`, `appName: String!`, `deploymentName: String!`, `package: Upload!`, `appVersion: String`, `description: String`, `mandatory: Boolean`, `rollout: Int` |
| `PromoteReleaseInput` | `serverId: String!`, `appName: String!`, `sourceDeploymentName: String!`, `destDeploymentName: String!`, `description: String` |
