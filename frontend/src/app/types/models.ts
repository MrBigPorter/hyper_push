// ==========================================
// HyperPush — Data Models (frontend types)
// 匹配 Prisma schema，不含 password 字段
// 日期使用 string (ISO 8601)
// ==========================================

/** Theme mode for light/dark toggle */
export type ThemeMode = 'light' | 'dark';

/** 用户角色 */
export type UserRole = 'admin' | 'viewer' | 'developer';

/** 用户 */
export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

/** 服务器状态 */
export type ServerStatus = 'online' | 'offline' | 'unknown';

/** 服务器 */
export interface Server {
  id: string;
  name: string;
  baseUrl: string;
  username: string;
  apiKey: string;
  isOnline: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

/** API 密钥 */
export interface ApiKey {
  id: string;
  name: string;
  key: string;
  active: boolean;
  userId: string;
  createdAt: string;
  expiresAt: string | null;
  lastUsed: string | null;
}

/** 审计日志操作类型 */
export type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'api_call';

/** 审计日志实体类型 */
export type AuditEntity = 'user' | 'server' | 'api_key' | 'app' | 'deployment' | 'release';

/** 审计日志 */
export interface AuditLog {
  id: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string | null;
  detail: string | null;
  userId: string;
  ip: string | null;
  createdAt: string;
}

// ─── CodePush ─────────────────────────────────────

/** CodePush 应用平台 */
export type AppPlatform = 'ios' | 'android' | 'both';

/** CodePush 应用 */
export interface CodePushApp {
  id: string;
  name: string;
  platform: AppPlatform;
  serverId: string;
  createdAt: string;
  updatedAt: string;
}

/** CodePush 部署环境 */
export type DeploymentEnv = 'Staging' | 'Production';

/** CodePush 部署 */
export interface Deployment {
  id: string;
  name: DeploymentEnv;
  appId: string;
  createdAt: string;
  updatedAt: string;
}

/** CodePush 发布状状态 */
export type ReleaseStatus = 'active' | 'rolled_back';

/** CodePush 发布 */
export interface Release {
  id: string;
  appVersion: string;
  deploymentId: string;
  label: string;
  hash: string;
  status: ReleaseStatus;
  size: number;
  isMandatory: boolean;
  isDisabled: boolean;
  rollout: number;
  description: string | null;
  releasedBy: string;
  createdAt: string;
}

/** CodePush 访问密钥类型 */
export type AccessKeyType = 'deployment' | 'viewer';

/** CodePush 访问密钥 */
export interface AccessKey {
  id: string;
  name: string;
  key: string;
  keyType: AccessKeyType;
  deploymentId: string | null;
  active: boolean;
  createdAt: string;
  expiresAt: string | null;
  lastUsed: string | null;
}

// ─── Shared ───────────────────────────────────────

/** 分页信息 */
export interface PaginationInfo {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** 分页查询输入 */
export interface PaginationInput {
  page?: number;
  pageSize?: number;
}

/** 排序方向 */
export type SortDirection = 'asc' | 'desc';

/** 通用列表响应 */
export interface ListResponse<T> {
  items: T[];
  pagination: PaginationInfo;
}
