import { Module } from '@nestjs/common';
import { AuditLogResolver } from './audit-log.resolver.js';
import { AuditLogService } from './audit-log.service.js';

@Module({
  providers: [AuditLogService, AuditLogResolver],
  exports: [AuditLogService],
})
export class AuditLogModule {}
