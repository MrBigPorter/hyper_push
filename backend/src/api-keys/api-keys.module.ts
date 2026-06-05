import { Module } from '@nestjs/common';
import { AuditLogModule } from '../audit-log/audit-log.module.js';
import { ApiKeysResolver } from './api-keys.resolver.js';
import { ApiKeysService } from './api-keys.service.js';

@Module({
  imports: [AuditLogModule],
  providers: [ApiKeysService, ApiKeysResolver],
  exports: [ApiKeysService],
})
export class ApiKeysModule {}
