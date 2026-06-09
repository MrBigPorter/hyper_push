// ==========================================
// HyperPush — Data Models (frontend types)
// Maps to Prisma schema, excludes password field
// Dates use string (ISO 8601)
// ==========================================

/** Theme mode for light/dark toggle */
export type ThemeMode = 'light' | 'dark';

/** User role */
export type UserRole = 'admin' | 'viewer' | 'developer';

/** User */
export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  totpEnabled: boolean;
  lastLoginAt: string | null;
  banned: boolean;
  bannedAt: string | null;
  bannedReason: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Server status */
export type ServerStatus = 'online' | 'offline' | 'unknown';

/** Server */
export interface Server {
  id: string;
  name: string;
  username: string;
  apiKey: string;
  isOnline: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

/** API Key */
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

/** Audit log action type */
export type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'api_call';

/** Audit log entity type */
export type AuditEntity = 'user' | 'server' | 'api_key' | 'app' | 'deployment' | 'release';

/** Audit log */
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

/** CodePush app platform */
export type AppPlatform = 'ios' | 'android' | 'both';

/** CodePush app */
export interface CodePushApp {
  id: string;
  name: string;
  platform: AppPlatform;
  serverId: string;
  createdAt: string;
  updatedAt: string;
}

/** CodePush deployment environment */
export type DeploymentEnv = 'Staging' | 'Production';

/** CodePush deployment */
export interface Deployment {
  id: string;
  name: DeploymentEnv;
  appId: string;
  createdAt: string;
  updatedAt: string;
}

/** CodePush release status */
export type ReleaseStatus = 'active' | 'rolled_back';

/** CodePush release */
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

/** CodePush access key type */
export type AccessKeyType = 'deployment' | 'viewer';

/** CodePush access key */
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

/** Pagination info */
export interface PaginationInfo {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Paginated user list (admin) */
export interface PaginatedUsers {
  items: User[];
  total: number;
  page: number;
  limit: number;
}

/** Pagination query input */
export interface PaginationInput {
  page?: number;
  pageSize?: number;
}

/** Sort direction */
export type SortDirection = 'asc' | 'desc';

/** Generic list response */
export interface ListResponse<T> {
  items: T[];
  pagination: PaginationInfo;
}
