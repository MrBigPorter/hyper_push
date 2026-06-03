import { Module } from '@nestjs/common';
import { ServersResolver } from './servers.resolver.js';
import { ServersService } from './servers.service.js';

@Module({
  providers: [ServersService, ServersResolver],
  exports: [ServersService],
})
export class ServersModule {}
