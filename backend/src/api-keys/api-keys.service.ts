import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateApiKeyInput } from './dto/create-api-key.input.js';
import * as crypto from 'node:crypto';

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const key = await this.prisma.apiKey.findFirst({
      where: { id, userId },
    });
    if (!key) {
      throw new NotFoundException('API key not found');
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

    return this.prisma.apiKey.create({
      data: {
        name: input.name,
        key: rawKey,
        userId,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.apiKey.delete({ where: { id } });
  }
}
