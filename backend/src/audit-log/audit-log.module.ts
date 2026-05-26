import { Module } from '@nestjs/common';
import { AuditLogService } from './audit-log.service.js';
import { AuditLogResolver } from './audit-log.resolver.js';

@Module({
  providers: [AuditLogService, AuditLogResolver],
  exports: [AuditLogService],
})
export class AuditLogModule {}
