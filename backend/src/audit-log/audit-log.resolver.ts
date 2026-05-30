import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuditLogService } from './audit-log.service.js';
import { AuditLogFilterInput } from '@/audit-log/dto';
import { AuditLogModel } from './models/audit-log.model.js';
import { AuditLogListResponseModel } from './models/audit-log-list.response.js';
import { GqlAuthGuard } from '@/auth/guards/gql-auth.guard.js';

@Resolver(() => AuditLogModel)
@UseGuards(GqlAuthGuard)
export class AuditLogResolver {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Query(() => AuditLogListResponseModel)
  async getAuditLogs(
    @Args('filter', { type: () => AuditLogFilterInput, nullable: true }) filter: AuditLogFilterInput | undefined,
    @Context() ctx: { req: { user: { sub: string } } },
  ) {
    return this.auditLogService.findAll(ctx.req.user.sub, filter);
  }

  @Mutation(() => AuditLogModel)
  async createAuditLog(
    @Args('action') action: string,
    @Args('entity') entity: string,
    @Args('entityId', { type: () => String, nullable: true }) entityId: string | undefined,
    @Args('detail', { type: () => String, nullable: true }) detail: string | undefined,
    @Context() ctx: { req: { user: { sub: string } } },
  ) {
    return this.auditLogService.create({
      action,
      entity,
      entityId,
      detail,
      userId: ctx.req.user.sub,
    });
  }
}
