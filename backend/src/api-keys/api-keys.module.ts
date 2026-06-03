import { Module } from '@nestjs/common';
import { ApiKeysResolver } from './api-keys.resolver.js';
import { ApiKeysService } from './api-keys.service.js';

@Module({
  providers: [ApiKeysService, ApiKeysResolver],
  exports: [ApiKeysService],
})
export class ApiKeysModule {}
