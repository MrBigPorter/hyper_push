import { Module } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service.js';
import { ApiKeysResolver } from './api-keys.resolver.js';

@Module({
  providers: [ApiKeysService, ApiKeysResolver],
  exports: [ApiKeysService],
})
export class ApiKeysModule {}
