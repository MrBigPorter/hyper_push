// ==========================================
// HyperPush — GraphQL Query/Mutation Types
// 严格类型，零 any
// ==========================================

import type {
  User,
  Server,
  ApiKey,
  AuditLog,
  CodePushApp,
  Deployment,
  Release,
  AccessKey,
  PaginationInput,
  SortDirection,
} from './models';

// ─── Auth ───────────────────────────────────────

export interface LoginMutationVariables {
  input: {
    email: string;
    password: string;
  };
}

export interface LoginMutationResponse {
  login: {
    token: string;
    user: User;
  };
}

export interface RegisterMutationVariables {
  input: {
    email: string;
    password: string;
    name?: string | null;
  };
}

export interface RegisterMutationResponse {
  register: {
    token: string;
    user: User;
  };
}

export interface MeQueryResponse {
  me: User;
}

// ─── Servers ────────────────────────────────────

export interface ServersQueryVariables {
  pagination?: PaginationInput;
  sortDirection?: SortDirection;
}

export interface ServersQueryResponse {
  servers: Server[];
}

export interface ServerQueryVariables {
  id: string;
}

export interface ServerQueryResponse {
  server: Server;
}

export interface CreateServerMutationVariables {
  input: {
    name: string;
    baseUrl: string;
    username: string;
    password: string;
  };
}

export interface CreateServerMutationResponse {
  createServer: Server;
}

export interface UpdateServerMutationVariables {
  input: {
    id: string;
    name?: string;
    baseUrl?: string;
    username?: string;
    password?: string;
    apiKey?: string;
  };
}

export interface UpdateServerMutationResponse {
  updateServer: Server;
}

export interface DeleteServerMutationVariables {
  id: string;
}

export interface DeleteServerMutationResponse {
  deleteServer: Server;
}

// ─── API Keys ───────────────────────────────────

export interface ApiKeysQueryVariables {
  pagination?: PaginationInput;
}

export interface ApiKeysQueryResponse {
  apiKeys: ApiKey[];
}

export interface CreateApiKeyMutationVariables {
  input: {
    name: string;
    expiresAt?: string | null;
  };
}

export interface CreateApiKeyMutationResponse {
  createApiKey: ApiKey;
}

export interface DeleteApiKeyMutationVariables {
  id: string;
}

export interface DeleteApiKeyMutationResponse {
  deleteApiKey: ApiKey;
}

// ─── Audit Logs ─────────────────────────────────

export interface AuditLogsQueryVariables {
  pagination?: PaginationInput;
  entity?: string;
  action?: string;
}

export interface AuditLogsQueryResponse {
  auditLogs: AuditLog[];
}

// ─── CodePush Apps ────────────────────────────

export interface AppsQueryVariables {
  serverId: string;
}

export interface AppsQueryResponse {
  apps: CodePushApp[];
}

export interface CreateAppMutationVariables {
  input: {
    name: string;
    platform: string;
    serverId: string;
  };
}

export interface CreateAppMutationResponse {
  createApp: CodePushApp;
}

export interface DeleteAppMutationVariables {
  id: string;
}

export interface DeleteAppMutationResponse {
  deleteApp: CodePushApp;
}

// ─── Deployments ──────────────────────────────

export interface DeploymentsQueryVariables {
  appId: string;
}

export interface DeploymentsQueryResponse {
  deployments: Deployment[];
}

// ─── Releases ─────────────────────────────────

export interface ReleasesQueryVariables {
  deploymentId: string;
}

export interface ReleasesQueryResponse {
  releases: Release[];
}

// ─── Access Keys ──────────────────────────────

export interface AccessKeysQueryVariables {
  appId: string;
}

export interface AccessKeysQueryResponse {
  accessKeys: AccessKey[];
}

export interface CreateAccessKeyMutationVariables {
  input: {
    name: string;
    keyType: string;
    appId: string;
  };
}

export interface CreateAccessKeyMutationResponse {
  createAccessKey: AccessKey;
}

export interface RevokeAccessKeyMutationVariables {
  id: string;
}

export interface RevokeAccessKeyMutationResponse {
  revokeAccessKey: AccessKey;
}

// ─── Health ─────────────────────────────────────

export interface HealthQueryResponse {
  _health: string;
}
