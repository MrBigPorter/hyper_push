// ==========================================
// HyperPush — GraphQL Query/Mutation Types
// Matches backend resolver field names
// ==========================================

import type { ApiKey, AuditLog, PaginationInfo, Server, User } from './models';

// ─── Auth ───────────────────────────────────────

export interface AuthResponseData {
  login: {
    accessToken: string;
    user: User;
  };
}

export interface RegisterResponseData {
  register: {
    accessToken: string;
    user: User;
  };
}

export interface MeResponseData {
  me: User;
}

export interface UpdateUserInput {
  id: string;
  name?: string;
}

export interface UpdateUserResponseData {
  updateUser: User;
}

// ─── Servers ────────────────────────────────────

export interface ServersResponseData {
  getServers: Server[];
}

export interface ServerResponseData {
  getServer: Server;
}

export interface CreateServerInput {
  name: string;
  username: string;
  password: string;
}

export interface CreateServerResponseData {
  createServer: Server;
}

export interface UpdateServerInput {
  id: string;
  name?: string;
  username?: string;
  password?: string;
  apiKey?: string;
}

export interface UpdateServerResponseData {
  updateServer: Server;
}

export interface DeleteServerResponseData {
  deleteServer: Server;
}

// ─── API Keys ───────────────────────────────────

export interface ApiKeysResponseData {
  getApiKeys: ApiKey[];
}

export interface CreateApiKeyInput {
  name: string;
}

export interface CreateApiKeyResponseData {
  createApiKey: ApiKey;
}

export interface DeleteApiKeyResponseData {
  deleteApiKey: ApiKey;
}

// ─── Audit Logs ─────────────────────────────────

export interface AuditLogsFilterInput {
  entity?: string;
  action?: string;
  page?: number;
  pageSize?: number;
}

export interface AuditLogsResponseData {
  getAuditLogs: {
    items: AuditLog[];
    pagination: PaginationInfo;
  };
}

// ─── CodePush ───────────────────────────────────

export interface CodepushAppsResponseData {
  codepushApps: Record<string, unknown>[];
}

export interface CodepushDeploymentsResponseData {
  codepushDeployments: Record<string, unknown>[];
}

export interface CodepushReleaseHistoryResponseData {
  codepushReleaseHistory: Record<string, unknown>[];
}

export interface CodepushAccessKeysResponseData {
  codepushAccessKeys: Record<string, unknown>[];
}
