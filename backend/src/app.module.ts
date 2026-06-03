import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';
import { ApiKeysModule } from './api-keys/api-keys.module.js';
import { AppResolver } from './app.resolver.js';
import { AuditLogModule } from './audit-log/audit-log.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CodepushModule } from './codepush/codepush.module.js';
import { GraphiQLModule } from './graphiql/graphiql.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ServersModule } from './servers/servers.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'schema.gql',
      sortSchema: true,
      playground: false,
      buildSchemaOptions: {
        // biome-ignore lint/suspicious/noExplicitAny: NestJS GraphQL scalarsMap requires this cast
        scalarsMap: [{ type: GraphQLJSON as any, scalar: GraphQLJSON as any }],
      },
    }),
    PrismaModule,
    AuthModule,
    ServersModule,
    CodepushModule,
    ApiKeysModule,
    AuditLogModule,
    GraphiQLModule,
  ],
  providers: [AppResolver],
})
export class AppModule {}
