import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

/** Internal Docker network address for the codepush service */
const CODEPUSH_BASE_URL = 'http://hyperpush-codepush-prod:3000';

/**
 * Response shape from lisong/code-push-server v5.7.1 endpoints.
 * Many endpoints return plain text strings on error; this handles both.
 */
interface CodePushRawResponse {
  status?: string;
  results?: Record<string, unknown>;
  [key: string]: unknown;
}

@Injectable()
export class CodepushService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Auth helpers ───────────────────────────────────────────────────────

  /** Look up a server by ID and return its CODEPUSH_BASE_URL + stored JWT token */
  private async getServerAuth(serverId: string): Promise<{ baseUrl: string; token: string }> {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
    });
    if (!server) {
      throw new NotFoundException(`Server ${serverId} not found`);
    }
    return { baseUrl: CODEPUSH_BASE_URL.replace(/\/+$/, ''), token: server.apiKey };
  }

  /**
   * Make an authenticated request to the CodePush server.
   * Handles both JSON and plain-text error responses.
   */
  private async fetchWithAuth(
    serverId: string,
    method: string,
    path: string,
    body?: Record<string, unknown> | null,
    extraHeaders?: Record<string, string>,
  ): Promise<unknown> {
    const { baseUrl, token } = await this.getServerAuth(serverId);
    const url = `${baseUrl}${path}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      ...extraHeaders,
    };

    if (body && !extraHeaders?.['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.parseResponse(response);
  }

  /** Forward a multipart request (release upload) to the CodePush server */
  async forwardMultipart(
    serverId: string,
    method: string,
    path: string,
    formData: FormData,
  ): Promise<unknown> {
    const { baseUrl, token } = await this.getServerAuth(serverId);
    const url = `${baseUrl}${path}`;

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        // Do NOT set Content-Type — let fetch set the multipart boundary
      },
      body: formData,
    });

    return this.parseResponse(response);
  }

  private async parseResponse(response: Response): Promise<unknown> {
    const contentType = response.headers.get('content-type') || '';
    let data: unknown;

    if (contentType.includes('application/json')) {
      data = (await response.json()) as unknown;
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const msg = typeof data === 'string' ? data : JSON.stringify(data);
      throw new Error(`CodePush API error (${response.status}): ${msg}`);
    }

    return data;
  }

  // ── Auth ───────────────────────────────────────────────────────────────

  /** POST /auth/login — returns JWT token from CodePush server */
  async login(serverId: string, account: string, password: string): Promise<string> {
    const { baseUrl } = await this.getServerAuth(serverId);
    const url = `${baseUrl}/auth/login`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account, password }),
    });

    const data = (await this.parseResponse(response)) as CodePushRawResponse;

    if (data?.status !== 'OK' || !data?.results?.tokens) {
      throw new Error(`CodePush login failed: unexpected response ${JSON.stringify(data)}`);
    }

    return data.results.tokens as string;
  }

  /** POST /auth/logout */
  async logout(serverId: string): Promise<string> {
    const data = await this.fetchWithAuth(serverId, 'POST', '/auth/logout');
    return String(data);
  }

  // ── Account ────────────────────────────────────────────────────────────

  /** GET /account */
  async getAccount(serverId: string): Promise<unknown> {
    return this.fetchWithAuth(serverId, 'GET', '/account');
  }

  // ── Access Keys ────────────────────────────────────────────────────────

  /** GET /accessKeys */
  async listAccessKeys(serverId: string): Promise<unknown> {
    const result = await this.fetchWithAuth(serverId, 'GET', '/accessKeys');
    // CodePush server returns { accessKeys: [...] } — extract the array
    if (
      result &&
      typeof result === 'object' &&
      'accessKeys' in (result as Record<string, unknown>)
    ) {
      return (result as Record<string, unknown>).accessKeys;
    }
    return result;
  }

  /** POST /accessKeys — requires { createdBy, friendlyName, description? } */
  async createAccessKey(
    serverId: string,
    friendlyName: string,
    createdBy?: string,
    _ttl?: number,
    description?: string,
  ): Promise<unknown> {
    const body: Record<string, unknown> = {
      createdBy: createdBy || 'hyperpush',
      friendlyName,
    };
    // NOTE: code-push-server does NOT accept `ttl` in the request body
    // (class-validator whitelist rejects unknown properties).
    // TTL is configured server-side via `config.accessKeyTTL` or defaults.
    if (description !== undefined) body.description = description;

    return this.fetchWithAuth(serverId, 'POST', '/accessKeys', body);
  }

  /** DELETE /accessKeys/:name */
  async deleteAccessKey(serverId: string, name: string): Promise<unknown> {
    return this.fetchWithAuth(serverId, 'DELETE', `/accessKeys/${encodeURIComponent(name)}`);
  }

  // ── Apps ───────────────────────────────────────────────────────────────

  /** GET /apps */
  async listApps(serverId: string): Promise<unknown> {
    const result = await this.fetchWithAuth(serverId, 'GET', '/apps');
    // CodePush server returns { apps: [...] } — extract the array
    if (result && typeof result === 'object' && 'apps' in (result as Record<string, unknown>)) {
      return (result as Record<string, unknown>).apps;
    }
    return result;
  }

  /** POST /apps — requires { name, os, platform } */
  async createApp(serverId: string, name: string, os: string, platform: string): Promise<unknown> {
    // Normalize platform name: "React Native" → "React-Native" (CodePush server expects hyphenated format)
    const normalizedPlatform = platform.replace(/ /g, '-');
    return this.fetchWithAuth(serverId, 'POST', '/apps', {
      name,
      os,
      platform: normalizedPlatform,
    });
  }

  /** PATCH /apps/:appName — rename an app */
  async updateApp(serverId: string, appName: string, newName: string): Promise<unknown> {
    return this.fetchWithAuth(serverId, 'PATCH', `/apps/${encodeURIComponent(appName)}`, {
      name: newName,
    });
  }

  /** DELETE /apps/:appName */
  async deleteApp(serverId: string, appName: string): Promise<unknown> {
    return this.fetchWithAuth(serverId, 'DELETE', `/apps/${encodeURIComponent(appName)}`);
  }

  /** POST /apps/:appName/transfer/:email */
  async transferApp(serverId: string, appName: string, email: string): Promise<unknown> {
    return this.fetchWithAuth(
      serverId,
      'POST',
      `/apps/${encodeURIComponent(appName)}/transfer/${encodeURIComponent(email)}`,
    );
  }

  /** GET /apps/:appName/collaborators */
  async listCollaborators(serverId: string, appName: string): Promise<unknown> {
    return this.fetchWithAuth(
      serverId,
      'GET',
      `/apps/${encodeURIComponent(appName)}/collaborators`,
    );
  }

  /** POST /apps/:appName/collaborators/:email */
  async addCollaborator(serverId: string, appName: string, email: string): Promise<unknown> {
    return this.fetchWithAuth(
      serverId,
      'POST',
      `/apps/${encodeURIComponent(appName)}/collaborators/${encodeURIComponent(email)}`,
    );
  }

  /** DELETE /apps/:appName/collaborators/:email */
  async removeCollaborator(serverId: string, appName: string, email: string): Promise<unknown> {
    return this.fetchWithAuth(
      serverId,
      'DELETE',
      `/apps/${encodeURIComponent(appName)}/collaborators/${encodeURIComponent(email)}`,
    );
  }

  // ── Deployments ────────────────────────────────────────────────────────

  /** GET /apps/:appName/deployments */
  async listDeployments(serverId: string, appName: string): Promise<unknown> {
    const result = await this.fetchWithAuth(
      serverId,
      'GET',
      `/apps/${encodeURIComponent(appName)}/deployments`,
    );
    // CodePush server returns { deployments: [...] } — extract the array
    if (
      result &&
      typeof result === 'object' &&
      'deployments' in (result as Record<string, unknown>)
    ) {
      return (result as Record<string, unknown>).deployments;
    }
    return result;
  }

  /** GET /apps/:appName/deployments/:deploymentName */
  async getDeployment(serverId: string, appName: string, deploymentName: string): Promise<unknown> {
    return this.fetchWithAuth(
      serverId,
      'GET',
      `/apps/${encodeURIComponent(appName)}/deployments/${encodeURIComponent(deploymentName)}`,
    );
  }

  /** POST /apps/:appName/deployments */
  async createDeployment(serverId: string, appName: string, name: string): Promise<unknown> {
    return this.fetchWithAuth(
      serverId,
      'POST',
      `/apps/${encodeURIComponent(appName)}/deployments`,
      { name },
    );
  }

  /** PATCH /apps/:appName/deployments/:deploymentName */
  async updateDeployment(
    serverId: string,
    appName: string,
    deploymentName: string,
    newName: string,
  ): Promise<unknown> {
    return this.fetchWithAuth(
      serverId,
      'PATCH',
      `/apps/${encodeURIComponent(appName)}/deployments/${encodeURIComponent(deploymentName)}`,
      { name: newName },
    );
  }

  /** DELETE /apps/:appName/deployments/:deploymentName */
  async deleteDeployment(
    serverId: string,
    appName: string,
    deploymentName: string,
  ): Promise<unknown> {
    return this.fetchWithAuth(
      serverId,
      'DELETE',
      `/apps/${encodeURIComponent(appName)}/deployments/${encodeURIComponent(deploymentName)}`,
    );
  }

  // ── Releases ───────────────────────────────────────────────────────────

  /**
   * GET /apps/:appName/deployments/:deploymentName/history
   * Note: CodePush server uses /history, not /releases
   */
  async releaseHistory(
    serverId: string,
    appName: string,
    deploymentName: string,
  ): Promise<unknown> {
    const result = await this.fetchWithAuth(
      serverId,
      'GET',
      `/apps/${encodeURIComponent(appName)}/deployments/${encodeURIComponent(deploymentName)}/history`,
    );
    // CodePush server returns { history: [...] } — extract the array
    if (result && typeof result === 'object' && 'history' in (result as Record<string, unknown>)) {
      return (result as Record<string, unknown>).history;
    }
    return result;
  }

  /**
   * PATCH /apps/:appName/deployments/:deploymentName/release
   * Update a release's metadata (label, isDisabled, rollout, etc.)
   */
  async updateRelease(
    serverId: string,
    appName: string,
    deploymentName: string,
    label: string,
    patch: Record<string, unknown>,
  ): Promise<unknown> {
    return this.fetchWithAuth(
      serverId,
      'PATCH',
      `/apps/${encodeURIComponent(appName)}/deployments/${encodeURIComponent(deploymentName)}/release`,
      { packageInfo: { label, ...patch } },
    );
  }

  /**
   * POST /apps/:appName/deployments/:source/promote/:dest
   */
  async promoteRelease(
    serverId: string,
    appName: string,
    sourceDeploymentName: string,
    destDeploymentName: string,
    options?: Record<string, unknown>,
  ): Promise<unknown> {
    const body = options ? { packageInfo: options } : {};
    return this.fetchWithAuth(
      serverId,
      'POST',
      `/apps/${encodeURIComponent(appName)}/deployments/${encodeURIComponent(sourceDeploymentName)}/promote/${encodeURIComponent(destDeploymentName)}`,
      body,
    );
  }

  /** POST /apps/:appName/deployments/:deploymentName/rollback */
  async rollbackRelease(
    serverId: string,
    appName: string,
    deploymentName: string,
  ): Promise<unknown> {
    return this.fetchWithAuth(
      serverId,
      'POST',
      `/apps/${encodeURIComponent(appName)}/deployments/${encodeURIComponent(deploymentName)}/rollback`,
    );
  }

  /** POST /apps/:appName/deployments/:deploymentName/rollback/:label */
  async rollbackToLabel(
    serverId: string,
    appName: string,
    deploymentName: string,
    label: string,
  ): Promise<unknown> {
    return this.fetchWithAuth(
      serverId,
      'POST',
      `/apps/${encodeURIComponent(appName)}/deployments/${encodeURIComponent(deploymentName)}/rollback/${encodeURIComponent(label)}`,
    );
  }

  // ── History ────────────────────────────────────────────────────────────

  /** DELETE /apps/:appName/deployments/:deploymentName/history */
  async clearHistory(serverId: string, appName: string, deploymentName: string): Promise<unknown> {
    return this.fetchWithAuth(
      serverId,
      'DELETE',
      `/apps/${encodeURIComponent(appName)}/deployments/${encodeURIComponent(deploymentName)}/history`,
    );
  }

  // ── Metrics ────────────────────────────────────────────────────────────

  /** GET /apps/:appName/deployments/:deploymentName/metrics */
  async deploymentMetrics(
    serverId: string,
    appName: string,
    deploymentName: string,
  ): Promise<unknown> {
    return this.fetchWithAuth(
      serverId,
      'GET',
      `/apps/${encodeURIComponent(appName)}/deployments/${encodeURIComponent(deploymentName)}/metrics`,
    );
  }
}
