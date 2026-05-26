import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ServersModule } from './servers/servers.module.js';
import { CodepushModule } from './codepush/codepush.module.js';
import { ApiKeysModule } from './api-keys/api-keys.module.js';
import { AuditLogModule } from './audit-log/audit-log.module.js';
import { GraphQLJSON } from 'graphql-type-json';
import { AppResolver } from './app.resolver.js';
import { GraphiQLModule } from './graphiql/graphiql.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'schema.gql',
      sortSchema: true,
      playground: false,
      buildSchemaOptions: {
        scalarsMap: [
          { type: GraphQLJSON as any, scalar: GraphQLJSON as any },
        ],
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
