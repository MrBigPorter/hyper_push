import * as crypto from 'node:crypto';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditLogService } from '../audit-log/audit-log.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateApiKeyInput } from './dto/create-api-key.input.js';

@Injectable()
export class ApiKeysService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async findAll(userId: string) {
    return this.prisma.apiKey.findMany({
      where: {
        userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const key = await this.prisma.apiKey.findFirst({
      where: {
        id,
        userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
    if (!key) {
      throw new NotFoundException('API key not found or has expired');
    }
    return key;
  }

  async create(input: CreateApiKeyInput, userId: string) {
    // Generate a unique API key
    const rawKey = `hp_${crypto.randomBytes(32).toString('hex')}`;

    // Check for uniqueness
    const existing = await this.prisma.apiKey.findUnique({
      where: { key: rawKey },
    });
    if (existing) {
      throw new ConflictException('Key collision, please try again');
    }

    const apiKey = await this.prisma.apiKey.create({
      data: {
        name: input.name,
        key: rawKey,
        userId,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      },
    });

    // Audit log: API key created
    await this.auditLogService.create({
      userId,
      action: 'create_api_key',
      entity: 'api_key',
      entityId: apiKey.id,
      detail: `API key created: ${input.name}`,
    });

    return apiKey;
  }

  async remove(id: string, userId: string) {
    const key = await this.findOne(id, userId);
    await this.prisma.apiKey.delete({ where: { id } });

    // Audit log: API key deleted
    await this.auditLogService.create({
      userId,
      action: 'delete_api_key',
      entity: 'api_key',
      entityId: id,
      detail: `API key deleted: ${key.name}`,
    });

    return true;
  }
}
