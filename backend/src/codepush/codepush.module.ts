import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { CodepushController } from './codepush.controller.js';
import { CodepushResolver } from './codepush.resolver.js';
import { CodepushService } from './codepush.service.js';
import { CodepushDbService } from './codepush-db.service.js';
import { CodepushGithubService } from './codepush-github.service.js';

@Module({
  imports: [
    MulterModule.register({
      limits: {
        fileSize: 100 * 1024 * 1024, // 100 MB max upload
      },
    }),
  ],
  providers: [CodepushService, CodepushResolver, CodepushDbService, CodepushGithubService],
  controllers: [CodepushController],
  exports: [CodepushService, CodepushDbService, CodepushGithubService],
})
export class CodepushModule {}
