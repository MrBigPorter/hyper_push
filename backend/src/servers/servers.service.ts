import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreateServerInput, UpdateServerInput } from '@/servers/dto';
import { AuditLogService } from '../audit-log/audit-log.service.js';
import { CodepushDbService } from '../codepush/codepush-db.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

/** Internal Docker network address for the codepush service */
const CODEPUSH_BASE_URL = 'http://hyperpush-codepush-prod:3000';

/** Response from POST /auth/login */
interface CodePushAuthResponse {
  status: string;
  results: {
    tokens: string; // JWT token
  };
}

@Injectable()
export class ServersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly codepushDb: CodepushDbService,
    private readonly auditLogService: AuditLogService,
  ) {}

  /**
   * Ping the code-push-server health endpoint.
   * Returns true if the server responds with HTTP 200.
   */
  private async pingCodePushServer(): Promise<boolean> {
    try {
      const url = `${CODEPUSH_BASE_URL.replace(/\/+$/, '')}/`;
      const response = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(5000) });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Run health check for a single server: ping the code-push-server
   * and update isOnline in the database accordingly.
   */
  private async healthCheck(server: { id: string; isOnline: boolean }): Promise<void> {
    const online = await this.pingCodePushServer();
    if (online !== server.isOnline) {
      await this.prisma.server.update({
        where: { id: server.id },
        data: { isOnline: online },
      });
    }
  }

  async findAll(userId: string) {
    const servers = await this.prisma.server.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    // Run health checks in background (fire-and-forget)
    for (const server of servers) {
      this.healthCheck(server).catch(() => {});
    }
    return servers;
  }

  async findOne(id: string, userId: string) {
    const server = await this.prisma.server.findFirst({
      where: { id, userId },
    });
    if (!server) {
      throw new NotFoundException('Server not found');
    }
    // Run health check in background
    this.healthCheck(server).catch(() => {});
    return server;
  }

  async create(input: CreateServerInput, userId: string) {
    // Login to CodePush server (POST /auth/login) to obtain JWT token.
    // If login fails (account may not exist yet), try registering first
    // via direct MySQL insert (code-push-server v5.7.1 has no
    // /auth/register endpoint), then retry login.
    let jwtToken: string;
    try {
      jwtToken = await this.loginToCodePush(input.username, input.password);
    } catch {
      // User may not exist in code-push-server's MySQL yet.
      // Insert directly into MySQL (bypasses broken /auth/register).
      await this.codepushDb.ensureUser(input.username, input.password);
      jwtToken = await this.loginToCodePush(input.username, input.password);
    }

    const server = await this.prisma.server.create({
      data: {
        name: input.name,
        username: input.username,
        apiKey: jwtToken,
        isOnline: true, // Login succeeded, mark as online
        userId,
      },
    });

    // Audit log: server created
    await this.auditLogService.create({
      userId,
      action: 'create_server',
      entity: 'server',
      entityId: server.id,
      detail: `Server created: ${input.name}`,
    });

    return server;
  }

  async update(input: UpdateServerInput, userId: string) {
    const existing = await this.findOne(input.id, userId);
    const data: Record<string, string | null> = {};

    if (input.name !== undefined) data.name = input.name;

    // If username provided, update stored username
    if (input.username !== undefined) data.username = input.username;

    // If password provided, re-login to get new JWT token
    if (input.password !== undefined) {
      const username = input.username ?? existing.username;
      const jwtToken = await this.loginToCodePush(username, input.password);
      data.apiKey = jwtToken;
    }

    const updated = await this.prisma.server.update({
      where: { id: input.id },
      data,
    });

    // Audit log: server updated
    await this.auditLogService.create({
      userId,
      action: 'update_server',
      entity: 'server',
      entityId: input.id,
      detail: `Server updated: ${existing.name}`,
    });

    return updated;
  }

  async remove(id: string, userId: string) {
    const server = await this.findOne(id, userId);
    await this.prisma.server.delete({ where: { id } });

    // Audit log: server deleted
    await this.auditLogService.create({
      userId,
      action: 'delete_server',
      entity: 'server',
      entityId: id,
      detail: `Server deleted: ${server.name}`,
    });

    return true;
  }

  /**
   * Login to CodePush server and return the JWT token (stored as apiKey).
   * POST {baseUrl}/auth/login { account, password } → { status, results: { tokens: <JWT> } }
   *
   * The base URL is auto-derived from the Docker service name (CODEPUSH_BASE_URL constant).
   * Note: lisong/code-push-server v5.7.1 uses JWT tokens (>64 chars) for admin API access.
   * Access tokens (≤64 chars) are for client SDK use only.
   */
  private async loginToCodePush(username: string, password: string): Promise<string> {
    const url = `${CODEPUSH_BASE_URL.replace(/\/+$/, '')}/auth/login`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account: username, password }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`CodePush login failed (${response.status}): ${text}`);
    }

    const data = (await response.json()) as CodePushAuthResponse;

    if (data.status !== 'OK' || !data.results?.tokens) {
      throw new Error(`CodePush login failed: unexpected response ${JSON.stringify(data)}`);
    }

    return data.results.tokens;
  }
}
