import { Injectable } from '@nestjs/common';
import type { AuditLogFilterInput } from '@/audit-log/dto';
import type { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, filter?: AuditLogFilterInput) {
    const where: Record<string, unknown> = { userId };

    if (filter?.entity) {
      where.entity = filter.entity;
    }
    if (filter?.action) {
      where.action = filter.action;
    }

    const page = filter?.page ?? 1;
    const pageSize = filter?.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async create(data: {
    action: string;
    entity: string;
    entityId?: string;
    detail?: string;
    userId: string;
    ip?: string;
  }) {
    return this.prisma.auditLog.create({ data });
  }
}
