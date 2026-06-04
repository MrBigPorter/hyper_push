import { Module } from '@nestjs/common';
import { CodepushModule } from '../codepush/codepush.module.js';
import { ServersResolver } from './servers.resolver.js';
import { ServersService } from './servers.service.js';

@Module({
  imports: [CodepushModule],
  providers: [ServersService, ServersResolver],
  exports: [ServersService],
})
export class ServersModule {}
