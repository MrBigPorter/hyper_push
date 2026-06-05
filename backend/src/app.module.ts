import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { ThrottlerModule } from '@nestjs/throttler';
import depthLimit from 'graphql-depth-limit';
import { GraphQLJSON } from 'graphql-type-json';
import { LoggerModule } from 'nestjs-pino';
import { ApiKeysModule } from './api-keys/api-keys.module.js';
import { AppResolver } from './app.resolver.js';
import { AuditLogModule } from './audit-log/audit-log.module.js';
import { AuthModule } from './auth/auth.module.js';
import { GqlThrottlerGuard } from './auth/guards/gql-throttler.guard.js';
import { CodepushModule } from './codepush/codepush.module.js';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter.js';
import { RecaptchaModule } from './common/recaptcha/recaptcha.module.js';
import { GraphiQLModule } from './graphiql/graphiql.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ServersModule } from './servers/servers.module.js';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
        level: process.env.LOG_LEVEL ?? 'info',
        autoLogging: {
          ignore: (req) => req.url === '/graphql' && req.method === 'POST',
        },
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'body.password',
            'body.totpToken',
          ],
          censor: '[REDACTED]',
        },
      },
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'schema.gql',
      sortSchema: true,
      playground: false,
      introspection: process.env.NODE_ENV !== 'production',
      validationRules: [depthLimit(7)],
      buildSchemaOptions: {
        // biome-ignore lint/suspicious/noExplicitAny: NestJS GraphQL scalarsMap requires this cast
        scalarsMap: [{ type: GraphQLJSON as any, scalar: GraphQLJSON as any }],
      },
    }),
    RecaptchaModule,
    PrismaModule,
    AuthModule,
    ServersModule,
    CodepushModule,
    ApiKeysModule,
    AuditLogModule,
    GraphiQLModule,
  ],
  providers: [
    AppResolver,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: GqlThrottlerGuard,
    },
  ],
})
export class AppModule {}
