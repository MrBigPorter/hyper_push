# HyperPush GraphQL API 搭建指南

> 本文档供你手写 GraphQL 层代码时参考。所有代码示例可直接复制使用。
> 我已提前创建好**纯业务逻辑**（不含 GraphQL 装饰器）的文件，你只需专注写 GraphQL 部分。

## 一、项目现状

### 我已创建的文件（你不需要动）

```
src/
  main.ts                          # NestJS 入口
  app.module.ts                    # 根模块（已配置 GraphQLModule + PrismaModule）
  prisma/
    prisma.service.ts              # Prisma 客户端
    prisma.module.ts               # Prisma 模块（全局）
  auth/
    auth.module.ts                 # 认证模块（不含 resolver，等你添加）
    auth.service.ts                # 认证业务逻辑：register/login/getMe
    jwt.strategy.ts                # Passport JWT 策略
  servers/
    servers.service.ts             # 服务器 CRUD 业务逻辑
```

### 你需要创建的目录结构（全部手写）

```
src/
  common/
    guards/
      jwt-auth.guard.ts            # GraphQL JWT 守卫
    decorators/
      current-user.decorator.ts    # @CurrentUser() 参数装饰器
  auth/
    models/
      user.model.ts                # @ObjectType User
      auth.model.ts                # @ObjectType AuthPayload
    dto/
      login.input.ts               # @InputType LoginInput
      register.input.ts            # @InputType RegisterInput
    auth.resolver.ts               # AuthResolver
  servers/
    models/
      server.model.ts              # @ObjectType Server
    dto/
      create-server.input.ts       # @InputType CreateServerInput
      update-server.input.ts       # @InputType UpdateServerInput
    servers.resolver.ts            # ServersResolver
    servers.module.ts              # ServersModule
  codepush/
    codepush.module.ts
    codepush.resolver.ts
    codepush.service.ts
    dto/
      get-apps.input.ts
      create-app.input.ts
      ...
  api-keys/
    api-keys.module.ts
    api-keys.resolver.ts
    api-keys.service.ts
    dto/
      create-api-key.input.ts
  audit-log/
    audit-log.module.ts
    audit-log.resolver.ts
    audit-log.service.ts
    dto/
      audit-log-filter.input.ts
```

---

## 二、数据类型定义（参考 Prisma Schema）

你的 Prisma models 在 [`prisma/schema.prisma`](../HyperPush/prisma/schema.prisma):

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // NOT exposed via GraphQL
  name      String?
  role      String   @default("admin")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  servers    Server[]
  apiKeys    ApiKey[]
  auditLogs  AuditLog[]
}

model Server {
  id        String   @id @default(cuid())
  name      String
  baseUrl   String
  apiKey    String   // NOT exposed via GraphQL
  isOnline  Boolean  @default(false)
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model ApiKey {
  id        String    @id @default(cuid())
  name      String
  key       String    @unique
  active    Boolean   @default(true)
  userId    String
  user      User      @relation(fields: [userId], references: [id])
  createdAt DateTime  @default(now())
  expiresAt DateTime?
  lastUsed  DateTime?
}

model AuditLog {
  id        String   @id @default(cuid())
  action    String
  entity    String
  entityId  String?
  detail    String?
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  ip        String?
  createdAt DateTime @default(now())
}
```

---

## 三、文件创建顺序（建议按此顺序写）

| 步骤 | 文件 | 说明 |
|------|------|------|
| 1 | `common/guards/jwt-auth.guard.ts` | 基础组件，其他模块依赖 |
| 2 | `common/decorators/current-user.decorator.ts` | 基础组件，Resolvers 依赖 |
| 3 | `auth/models/user.model.ts` | ObjectType 定义 |
| 4 | `auth/models/auth.model.ts` | ObjectType 定义 |
| 5 | `auth/dto/login.input.ts` | InputType 定义 |
| 6 | `auth/dto/register.input.ts` | InputType 定义 |
| 7 | `auth/auth.resolver.ts` | 认证 Resolver |
| 8 | `servers/models/server.model.ts` | ObjectType 定义 |
| 9 | `servers/dto/create-server.input.ts` | InputType 定义 |
| 10 | `servers/dto/update-server.input.ts` | InputType 定义 |
| 11 | `servers/servers.resolver.ts` | 服务器 Resolver |
| 12 | `servers/servers.module.ts` | 服务器 Module |
| 13-16 | Codepush module (4 files) | CodePush 代理 |
| 17-19 | ApiKeys module (3 files) | API 密钥管理 |
| 20-22 | AuditLog module (3 files) | 审计日志 |
| 23 | 修改 `app.module.ts` | 注册所有模块 |

---

## 四、完整代码示例

### Step 1: `src/common/guards/jwt-auth.guard.ts`

NestJS Passport 默认用于 REST，GraphQL 需要从 `GqlExecutionContext` 取 `req`。

```typescript
import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }

  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required');
    }
    return user;
  }
}
```

### Step 2: `src/common/decorators/current-user.decorator.ts`

从 GraphQL context 中提取当前用户（JWT payload）。

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context);
    const user = ctx.getContext().req.user as JwtPayload;
    return data ? user?.[data] : user;
  },
);
```

### Step 3: `src/auth/models/user.model.ts`

> **重要**：不要暴露 `password` 字段。GraphQL ObjectType 只控制"对外暴露什么"，password 不在这里定义就不会出现在 schema 中。

```typescript
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  name?: string;

  @Field()
  role: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
```

### Step 4: `src/auth/models/auth.model.ts`

登录/注册的返回值：accessToken + 用户信息。

```typescript
import { ObjectType, Field } from '@nestjs/graphql';
import { User } from './user.model';

@ObjectType()
export class AuthPayload {
  @Field()
  accessToken: string;

  @Field(() => User)
  user: User;
}
```

### Step 5: `src/auth/dto/login.input.ts`

```typescript
import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, MinLength } from 'class-validator';

@InputType()
export class LoginInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @MinLength(6)
  password: string;
}
```

### Step 6: `src/auth/dto/register.input.ts`

```typescript
import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, MinLength, IsOptional } from 'class-validator';

@InputType()
export class RegisterInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @MinLength(6)
  password: string;

  @Field({ nullable: true })
  @IsOptional()
  name?: string;
}
```

### Step 7: `src/auth/auth.resolver.ts`（核心！）

这是最关键的一个文件。使用了上面定义的 ObjectType、InputType、Guard 和 Decorator。

```typescript
import { Resolver, Mutation, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { AuthPayload } from './models/auth.model';
import { User } from './models/user.model';
import { LoginInput } from './dto/login.input';
import { RegisterInput } from './dto/register.input';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthPayload)
  async register(@Args('input') input: RegisterInput) {
    return this.authService.register(input);
  }

  @Mutation(() => AuthPayload)
  async login(@Args('input') input: LoginInput) {
    return this.authService.login(input);
  }

  @Query(() => User)
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: JwtPayload) {
    return this.authService.getMe(user.sub);
  }
}
```

### Step 8: `src/servers/models/server.model.ts`

```typescript
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class Server {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  baseUrl: string;

  @Field()
  isOnline: boolean;

  @Field()
  userId: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
```

### Step 9: `src/servers/dto/create-server.input.ts`

```typescript
import { InputType, Field } from '@nestjs/graphql';
import { IsString } from 'class-validator';

@InputType()
export class CreateServerInput {
  @Field()
  @IsString()
  name: string;

  @Field()
  @IsString()
  baseUrl: string;

  @Field()
  @IsString()
  apiKey: string;
}
```

### Step 10: `src/servers/dto/update-server.input.ts`

```typescript
import { InputType, Field, ID } from '@nestjs/graphql';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

@InputType()
export class UpdateServerInput {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  baseUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;
}
```

### Step 11: `src/servers/servers.resolver.ts`

```typescript
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ServersService } from './servers.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Server } from './models/server.model';
import { CreateServerInput } from './dto/create-server.input';
import { UpdateServerInput } from './dto/update-server.input';

@Resolver(() => Server)
@UseGuards(JwtAuthGuard)
export class ServersResolver {
  constructor(private readonly serversService: ServersService) {}

  @Query(() => [Server])
  async servers(@CurrentUser() user: JwtPayload) {
    return this.serversService.findAll(user.sub);
  }

  @Query(() => Server)
  async server(
    @Args('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.serversService.findOne(id, user.sub);
  }

  @Mutation(() => Server)
  async createServer(
    @Args('input') input: CreateServerInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.serversService.create(input, user.sub);
  }

  @Mutation(() => Server)
  async updateServer(
    @Args('input') input: UpdateServerInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.serversService.update(input, user.sub);
  }

  @Mutation(() => Server)
  async deleteServer(
    @Args('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.serversService.remove(id, user.sub);
  }
}
```

### Step 12: `src/servers/servers.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ServersService } from './servers.service';
import { ServersResolver } from './servers.resolver';

@Module({
  providers: [ServersService, ServersResolver],
  exports: [ServersService],
})
export class ServersModule {}
```

### Step 13: 修改 `src/app.module.ts`

在所有 resolver/module 写好后，修改 `app.module.ts` 注册它们：

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ServersModule } from './servers/servers.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'schema.gql',    // code-first: 自动生成 schema.gql
      sortSchema: true,                 // 字段按字母排序
      playground: true,                 // 开发环境开启 GraphQL Playground
    }),
    PrismaModule,
    AuthModule,
    ServersModule,
  ],
})
export class AppModule {}
```

GraphQL 配置说明：
- `autoSchemaFile: 'schema.gql'` — 代码优先模式，NestJS 自动根据 decorators 生成 schema.gql 文件
- 启动后会在项目根目录生成 `schema.gql`，你可以看到完整的 GraphQL Schema

---

## 五、Codepush Proxy 模块（参考）

### `src/codepush/codepush.service.ts`

这是一个**代理服务**，通过 HTTP 请求将 GraphQL 请求转发到真实的 CodePush 服务器。

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CodepushService {
  constructor(private readonly prisma: PrismaService) {}

  private async getServerApiKey(serverId: string, userId: string) {
    const server = await this.prisma.server.findFirst({
      where: { id: serverId, userId },
    });
    if (!server) throw new NotFoundException('Server not found');
    return { baseUrl: server.baseUrl, apiKey: server.apiKey };
  }

  private async proxyRequest<T>(
    serverId: string,
    userId: string,
    path: string,
    method: string = 'GET',
    body?: any,
  ): Promise<T> {
    const { baseUrl, apiKey } = await this.getServerApiKey(serverId, userId);
    const url = `${baseUrl}/api/${path}`;

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`CodePush API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getApps(serverId: string, userId: string) {
    return this.proxyRequest(serverId, userId, 'apps');
  }

  async getApp(serverId: string, appName: string, userId: string) {
    return this.proxyRequest(serverId, userId, `apps/${appName}`);
  }

  async createApp(serverId: string, appName: string, userId: string) {
    return this.proxyRequest(serverId, userId, 'apps', 'POST', { name: appName });
  }

  async deleteApp(serverId: string, appName: string, userId: string) {
    return this.proxyRequest(serverId, userId, `apps/${appName}`, 'DELETE');
  }

  async getDeployments(serverId: string, appName: string, userId: string) {
    return this.proxyRequest(serverId, userId, `apps/${appName}/deployments`);
  }

  async getReleases(serverId: string, appName: string, deploymentName: string, userId: string) {
    return this.proxyRequest(serverId, userId, `apps/${appName}/deployments/${deploymentName}/releases`);
  }

  async promoteRelease(
    serverId: string,
    appName: string,
    fromDeployment: string,
    toDeployment: string,
    userId: string,
  ) {
    return this.proxyRequest(
      serverId,
      userId,
      `apps/${appName}/deployments/${fromDeployment}/promote/${toDeployment}`,
      'POST',
    );
  }

  async getAccessKeys(serverId: string, userId: string) {
    return this.proxyRequest(serverId, userId, 'accessKeys');
  }
}
```

### `src/codepush/codepush.resolver.ts`（你自己写，参考 ServersResolver 模式）

会用到的 Query / Mutation：
- `apps(serverId: String!): [JSON]`
- `app(serverId: String!, appName: String!): JSON`
- `createApp(serverId: String!, appName: String!): JSON`
- `deleteApp(serverId: String!, appName: String!): Boolean`
- `deployments(serverId: String!, appName: String!): [JSON]`
- `releases(serverId: String!, appName: String!, deploymentName: String!): [JSON]`
- `promoteRelease(...): JSON`
- `accessKeys(serverId: String!): [JSON]`

> 提示：返回值类型可以用 `@nestjs/graphql` 的 `GraphQLJSON` 来自 `graphql-type-json` 包。

### `src/codepush/codepush.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { CodepushService } from './codepush.service';
import { CodepushResolver } from './codepush.resolver';

@Module({
  providers: [CodepushService, CodepushResolver],
  exports: [CodepushService],
})
export class CodepushModule {}
```

### 安装 JSON scalar 类型

```bash
bun add graphql-type-json
```

然后注册到 GraphQLModule:

```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  // ...
  resolvers: { JSON: GraphQLJSON },
}),
```

---

## 六、API Keys 模块（参考）

### `src/api-keys/dto/create-api-key.input.ts`

```typescript
import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional, IsDate } from 'class-validator';

@InputType()
export class CreateApiKeyInput {
  @Field()
  @IsString()
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  expiresAt?: Date;
}
```

### `src/api-keys/api-keys.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApiKeyInput } from './dto/create-api-key.input';

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const key = await this.prisma.apiKey.findFirst({ where: { id, userId } });
    if (!key) throw new NotFoundException('API key not found');
    return key;
  }

  async create(input: CreateApiKeyInput, userId: string) {
    const key = `hp_${crypto.randomBytes(32).toString('hex')}`;
    return this.prisma.apiKey.create({
      data: {
        name: input.name,
        key,
        userId,
        expiresAt: input.expiresAt ?? null,
      },
    });
  }

  async toggleActive(id: string, userId: string) {
    const key = await this.findOne(id, userId);
    return this.prisma.apiKey.update({
      where: { id },
      data: { active: !key.active },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.apiKey.delete({ where: { id } });
  }
}
```

### `src/api-keys/api-keys.resolver.ts`（你自己写）

Queries / Mutations:
- `apiKeys: [ApiKey]` — 列出当前用户的所有 API Key
- `apiKey(id: String!): ApiKey` — 获取单个
- `createApiKey(input: CreateApiKeyInput!): ApiKey` — 创建
- `toggleApiKey(id: String!): ApiKey` — 启用/禁用
- `deleteApiKey(id: String!): ApiKey` — 删除

### `src/api-keys/api-keys.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { ApiKeysResolver } from './api-keys.resolver';

@Module({
  providers: [ApiKeysService, ApiKeysResolver],
  exports: [ApiKeysService],
})
export class ApiKeysModule {}
```

---

## 七、Audit Log 模块（参考）

### `src/audit-log/dto/audit-log-filter.input.ts`

```typescript
import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsString } from 'class-validator';

@InputType()
export class AuditLogFilter {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  action?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  entity?: string;

  @Field({ nullable: true })
  @IsOptional()
  startDate?: Date;

  @Field({ nullable: true })
  @IsOptional()
  endDate?: Date;
}
```

### `src/audit-log/audit-log.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogFilter } from './dto/audit-log-filter.input';

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, filter?: AuditLogFilter) {
    const where: any = { userId };

    if (filter) {
      if (filter.action) where.action = filter.action;
      if (filter.entity) where.entity = filter.entity;
      if (filter.startDate || filter.endDate) {
        where.createdAt = {};
        if (filter.startDate) where.createdAt.gte = filter.startDate;
        if (filter.endDate) where.createdAt.lte = filter.endDate;
      }
    }

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async log(params: {
    action: string;
    entity: string;
    entityId?: string;
    detail?: string;
    userId: string;
    ip?: string;
  }) {
    return this.prisma.auditLog.create({ data: params });
  }
}
```

### `src/audit-log/audit-log.resolver.ts`（你自己写）

Queries / Mutations:
- `auditLogs(filter: AuditLogFilter): [AuditLog]`

### `src/audit-log/audit-log.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { AuditLogResolver } from './audit-log.resolver';

@Module({
  providers: [AuditLogService, AuditLogResolver],
  exports: [AuditLogService],
})
export class AuditLogModule {}
```

---

## 八、生成的 GraphQL Schema（写完后自动生成）

当你写完所有 resolver 并 `bun run start:dev` 启动后，NestJS 会自动在根目录生成 `schema.gql`，内容类似：

```graphql
type AuthPayload {
  accessToken: String!
  user: User!
}

type Mutation {
  register(input: RegisterInput!): AuthPayload!
  login(input: LoginInput!): AuthPayload!
  createServer(input: CreateServerInput!): Server!
  updateServer(input: UpdateServerInput!): Server!
  deleteServer(id: String!): Server!
  createApiKey(input: CreateApiKeyInput!): ApiKey!
  toggleApiKey(id: String!): ApiKey!
  deleteApiKey(id: String!): ApiKey!
  # ...
}

type Query {
  me: User!
  servers: [Server!]!
  server(id: String!): Server!
  apiKeys: [ApiKey!]!
  auditLogs(filter: AuditLogFilter): [AuditLog!]!
  # ... CodePush proxy queries
}

type User {
  id: ID!
  email: String!
  name: String
  role: String!
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

---

## 九、验证步骤

写完每个模块后，运行以下命令验证：

```bash
# 1. 生成 Prisma 客户端
bun run db:generate

# 2. 编译后端
bun run build

# 3. 启动开发模式
bun run start:dev

# 4. 打开 GraphQL Playground 测试
# http://localhost:3000/graphql

# 5. 测试注册
mutation {
  register(input: { email: "test@test.com", password: "123456" }) {
    accessToken
    user { id email }
  }
}

# 6. 测试登录
mutation {
  login(input: { email: "test@test.com", password: "123456" }) {
    accessToken
    user { id email name }
  }
}

# 7. 测试 me（需要添加 Authorization: Bearer <token> 到 HTTP HEADERS）
query {
  me {
    id email name role
  }
}

# 8. 测试服务器 CRUD
mutation {
  createServer(input: { name: "Prod", baseUrl: "https://codepush.example.com", apiKey: "xxx" }) {
    id name isOnline
  }
}

query {
  servers {
    id name baseUrl isOnline
  }
}
```

GraphQL Playground 的 HTTP HEADERS 设置：

```json
{
  "Authorization": "Bearer <your-token-here>"
}
```

---

## 十、文件创建完成后需要修改的现有文件

### 修改 `src/auth/auth.module.ts`

添加 `AuthResolver` 到 providers:

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
      signOptions: { expiresIn: process.env.JWT_EXPIRATION || '7d' },
    }),
  ],
  providers: [AuthService, AuthResolver, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

### 修改 `src/app.module.ts`

添加所有新模块到 imports:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ServersModule } from './servers/servers.module';
import { CodepushModule } from './codepush/codepush.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { AuditLogModule } from './audit-log/audit-log.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'schema.gql',
      sortSchema: true,
      playground: true,
    }),
    PrismaModule,
    AuthModule,
    ServersModule,
    CodepushModule,
    ApiKeysModule,
    AuditLogModule,
  ],
})
export class AppModule {}
```

---

## 总结

1. **纯业务逻辑已就绪**：`auth.service.ts`、`servers.service.ts`、`jwt.strategy.ts`
2. **你需手写**：所有 `@ObjectType`、`@InputType`、Guard、Decorator、Resolver、Module 共约 22 个文件
3. **推荐顺序**：基础组件 → Auth → Servers → Codepush → ApiKeys → AuditLog
4. **每写一个模块就 `bun run build` 验证一次**
5. **全部写完后**，修改 `auth.module.ts` 和 `app.module.ts` 注册所有模块
6. **启动验证**：`bun run start:dev` → 打开 `http://localhost:3000/graphql` 测试
