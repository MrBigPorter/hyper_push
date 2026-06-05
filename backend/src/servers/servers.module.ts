import { Module } from '@nestjs/common';
import { AuditLogModule } from '../audit-log/audit-log.module.js';
import { CodepushModule } from '../codepush/codepush.module.js';
import { ServersResolver } from './servers.resolver.js';
import { ServersService } from './servers.service.js';

@Module({
  imports: [AuditLogModule, CodepushModule],
  providers: [ServersService, ServersResolver],
  exports: [ServersService],
})
export class ServersModule {}
