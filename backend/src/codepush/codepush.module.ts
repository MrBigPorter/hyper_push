import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { CodepushService } from './codepush.service.js';
import { CodepushResolver } from './codepush.resolver.js';
import { CodepushController } from './codepush.controller.js';

@Module({
  imports: [
    MulterModule.register({
      limits: {
        fileSize: 100 * 1024 * 1024, // 100 MB max upload
      },
    }),
  ],
  providers: [CodepushService, CodepushResolver],
  controllers: [CodepushController],
  exports: [CodepushService],
})
export class CodepushModule {}
