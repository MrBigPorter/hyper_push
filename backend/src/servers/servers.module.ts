import { Module } from '@nestjs/common';
import { ServersService } from './servers.service.js';
import { ServersResolver } from './servers.resolver.js';

@Module({
  providers: [ServersService, ServersResolver],
  exports: [ServersService],
})
export class ServersModule {}
