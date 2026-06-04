import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreateServerInput, UpdateServerInput } from '@/servers/dto';
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
  ) {}

  async findAll(userId: string) {
    return this.prisma.server.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const server = await this.prisma.server.findFirst({
      where: { id, userId },
    });
    if (!server) {
      throw new NotFoundException('Server not found');
    }
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

    return this.prisma.server.create({
      data: {
        name: input.name,
        username: input.username,
        apiKey: jwtToken,
        userId,
      },
    });
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

    return this.prisma.server.update({
      where: { id: input.id },
      data,
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.server.delete({ where: { id } });
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
