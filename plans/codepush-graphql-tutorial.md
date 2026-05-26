# HyperPush Backend GraphQL 教学文档

> 适用读者：已有 NestJS 基础，想学习 `@nestjs/graphql` 集成
> 目标：完成 HyperPush 所有后端 GraphQL Resolver（Auth、Servers、ApiKeys、AuditLog、Proxy）
> 前置条件：Phase 1 基础修复已完成（DTO、Module、tsconfig）

---

## 目录

1. [GraphQL + NestJS 核心概念](#一graphql--nestjs-核心概念)
2. [项目当前状态分析](#二项目当前状态分析)
3. [Auth Resolver 完整示例](#三auth-resolver-完整示例)
4. [GQL Auth Guard](#四gql-auth-guard)
5. [Servers CRUD Resolver](#五servers-crud-resolver)
6. [ApiKeys Module](#六apikeys-module)
7. [AuditLog Module](#七auditlog-module)
8. [Proxy Module（转发到 CodePush Server）](#八proxy-module转发到-code-push-server)
9. [Module 注册与 AppModule 整合](#九module-注册与-appmodule-整合)
10. [调试技巧与常见问题](#十调试技巧与常见问题)

---

## 一、GraphQL + NestJS 核心概念

### 1.1 GraphQL 在 NestJS 中的角色

```
Client (Apollo Client)          NestJS Server
       │                              │
       │  POST /graphql               │
       │  { "query": "..." }          │
       │─────────────────────────────►│
       │                              │
       │                              ├── @Resolver 解析请求
       │                              ├── @Query 处理查询
       │                              ├── @Mutation 处理变更
       │                              ├── @ResolveField 处理关联字段
       │                              │
       │  { "data": { ... } }         │
       │◄─────────────────────────────│
```

### 1.2 核心装饰器对照表

| 装饰器 | 用途 | 类似 REST |
|--------|------|-----------|
| `@ObjectType()` | 定义返回类型（类似 interface/dto） | 响应体结构 |
| `@InputType()` | 定义输入类型（参数结构） | 请求体结构 |
| `@Field()` | 声明字段 | 字段定义 |
| `@Resolver(of => X)` | 声明 Resolver | Controller |
| `@Query(returns => X)` | 查询（读操作） | `GET` |
| `@Mutation(returns => X)` | 变更（写操作） | `POST/PUT/DELETE` |
| `@Args()` | 接收参数 | `@Body()` / `@Param()` |
| `@Context()` | 获取 GraphQL 上下文 | `@Req()` |

### 1.3 文件组织规范

```
module/
├── module.resolver.ts    # GraphQL Resolver
├── module.service.ts     # 业务逻辑
├── module.module.ts      # Module 定义
├── dto/
│   ├── create-input.ts   # @InputType 创建参数
│   └── update-input.ts   # @InputType 更新参数
└── models/
    └── model.ts          # @ObjectType 返回类型
```

---

## 二、项目当前状态分析

### 2.1 已就绪的部分

- [`src/app.module.ts`](src/app.module.ts) — GraphQLModule 已配置（ApolloDriver，autoSchemaFile）
- [`src/prisma/prisma.service.ts`](src/prisma/prisma.service.ts) — PrismaService 全局可用
- [`src/auth/auth.service.ts`](src/auth/auth.service.ts) — AuthService 已实现
- [`src/auth/jwt.strategy.ts`](src/auth/jwt.strategy.ts) — JWT Strategy 已实现
- [`src/servers/servers.service.ts`](src/servers/servers.service.ts) — ServersService 已实现

### 2.2 缺少的部分（需要你完成）

```
src/
├── auth/
│   ├── auth.resolver.ts       ← 需要创建
│   ├── dto/
│   │   ├── register.input.ts  ← 需要创建
│   │   ├── login.input.ts     ← 需要创建
│   │   └── auth-payload.ts    ← 需要创建
│   └── guards/
│       └── gql-auth.guard.ts  ← 需要创建
├── servers/
│   ├── servers.resolver.ts    ← 需要创建
│   └── servers.module.ts      ← 需要创建 (依赖Phase1)
├── api-keys/
│   ├── api-keys.module.ts     ← 需要创建
│   ├── api-keys.service.ts    ← 需要创建
│   ├── api-keys.resolver.ts   ← 需要创建
│   └── dto/ + models/         ← 需要创建
├── audit-log/
│   ├── audit-log.module.ts    ← 需要创建
│   ├── audit-log.service.ts   ← 需要创建
│   ├── audit-log.resolver.ts  ← 需要创建
│   └── dto/ + models/         ← 需要创建
└── proxy/
    ├── proxy.module.ts        ← 需要创建
    ├── proxy.service.ts       ← 需要创建
    └── proxy.resolver.ts      ← 需要创建
```

---

## 三、Auth Resolver 完整示例

这是最完整的入门示例，包含了 GraphQL 需要理解的所有核心概念。

### 3.1 创建输入类型 (InputType)

**文件**: [`src/auth/dto/register.input.ts`](src/auth/dto/register.input.ts)

```typescript
import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

@InputType()
export class RegisterInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsString()
  @MinLength(6)
  password: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;
}
```

**关键点**:
- `@InputType()` 标记为 GraphQL 输入类型
- `@Field()` 声明字段（nullable: true 表示可选）
- `class-validator` 装饰器用于自动验证（ValidationPipe 已全局配置）

### 3.2 创建返回类型 (ObjectType)

**文件**: [`src/auth/dto/auth-payload.ts`](src/auth/dto/auth-payload.ts)

```typescript
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class UserType {
  @Field()
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

@ObjectType()
export class AuthPayload {
  @Field()
  accessToken: string;

  @Field(() => UserType)
  user: UserType;
}
```

**关键点**:
- `@ObjectType()` 标记为 GraphQL 返回类型
- `@Field(() => UserType)` 用于引用其他 ObjectType
- 字段名自动映射为 camelCase（Prisma 命名一致）

### 3.3 创建 Resolver

**文件**: [`src/auth/auth.resolver.ts`](src/auth/auth.resolver.ts)

```typescript
import { Resolver, Mutation, Query, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterInput } from './dto/register.input.js';
import { LoginInput } from './dto/login.input.js';
import { AuthPayload, UserType } from './dto/auth-payload.js';
import { GqlAuthGuard } from './guards/gql-auth.guard.js';

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

  @Query(() => UserType)
  @UseGuards(GqlAuthGuard)
  async me(@Context() context: { req: { user: { sub: string } } }) {
    return this.authService.getMe(context.req.user.sub);
  }
}
```

**关键点**:
- `@Resolver()` — 声明这是一个 GraphQL Resolver（不加参数就是顶级 Resolver）
- `@Mutation(() => AuthPayload)` — 变更操作，返回 AuthPayload 类型
- `@Query(() => UserType)` — 查询操作，返回 UserType 类型
- `@Args('input')` — 从 GraphQL 参数中提取 input 对象
- `@Context()` — 获取请求上下文，从中提取用户信息
- `@UseGuards(GqlAuthGuard)` — 使用 GraphQL 版的 AuthGuard

### 3.4 在 AuthModule 中注册 Resolver

**修改**: [`src/auth/auth.module.ts`](src/auth/auth.module.ts)

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service.js';
import { AuthResolver } from './auth.resolver.js';    // ← 新增
import { JwtStrategy } from './jwt.strategy.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
      signOptions: { expiresIn: process.env.JWT_EXPIRATION || '7d' },
    }),
  ],
  providers: [AuthService, AuthResolver, JwtStrategy],  // ← 新增 AuthResolver
  exports: [AuthService],
})
export class AuthModule {}
```

### 3.5 GraphQL 查询测试

启动后访问 `http://localhost:3000/graphql`，在 Playground 中测试：

```graphql
# 注册
mutation Register($input: RegisterInput!) {
  register(input: $input) {
    accessToken
    user {
      id
      email
      name
      role
    }
  }
}

# Variables:
{ "input": { "email": "test@example.com", "password": "123456", "name": "Test" } }
```

```graphql
# 查询当前用户（需要在 HTTP HEADERS 中传 token）
query Me {
  me {
    id
    email
    name
    role
  }
}

# HTTP HEADERS:
# { "Authorization": "Bearer <你的 accessToken>" }
```

---

## 四、GQL Auth Guard

### 4.1 为什么需要 GqlAuthGuard？

**问题**: NestJS 默认的 `AuthGuard('jwt')` 从 `request` 对象取 token，但在 GraphQL 中，请求通过 `context.req` 传递。

**解决**: 继承 `AuthGuard('jwt')` 并重写 `getRequest` 方法。

**文件**: [`src/auth/guards/gql-auth.guard.ts`](src/auth/guards/gql-auth.guard.ts)

```typescript
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  override getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
}
```

### 4.2 使用方式

```typescript
// 单个 Resolver 方法
@Query(() => UserType)
@UseGuards(GqlAuthGuard)
async me(@Context() context: GqlContext) {
  return this.authService.getMe(context.req.user.sub);
}

// 或整个 Resolver 类
@Resolver()
@UseGuards(GqlAuthGuard)  // 所有方法都需要认证
export class ServersResolver { ... }
```

### 4.3 类型定义

为了方便，可以定义一个 Context 类型：

```typescript
// 在 src/auth/dto/ 或共用目录中
export interface GqlContext {
  req: {
    user: {
      sub: string;     // 用户 ID
      email: string;
      role: string;
    };
  };
}
```

---

## 五、Servers CRUD Resolver

### 5.1 创建 DTO

**文件**: [`src/servers/dto/create-server.input.ts`](src/servers/dto/create-server.input.ts)

```typescript
import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional } from 'class-validator';

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

**文件**: [`src/servers/dto/update-server.input.ts`](src/servers/dto/update-server.input.ts)

```typescript
import { InputType, Field, PartialType } from '@nestjs/graphql';
import { CreateServerInput } from './create-server.input.js';

@InputType()
export class UpdateServerInput extends PartialType(CreateServerInput) {
  @Field()
  id: string;
}
```

> `PartialType` 是 `@nestjs/graphql` 提供的工具函数，自动将所有字段变为可选。

### 5.2 创建 GraphQL 返回 Model

**文件**: [`src/servers/models/server.model.ts`](src/servers/models/server.model.ts)

```typescript
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class ServerType {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  baseUrl: string;

  @Field()
  apiKey: string;

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

### 5.3 创建 Resolver

**文件**: [`src/servers/servers.resolver.ts`](src/servers/servers.resolver.ts)

```typescript
import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ServersService } from './servers.service.js';
import { CreateServerInput } from './dto/create-server.input.js';
import { UpdateServerInput } from './dto/update-server.input.js';
import { ServerType } from './models/server.model.js';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard.js';
import { GqlContext } from '../auth/dto/gql-context.js';

@Resolver()
@UseGuards(GqlAuthGuard)
export class ServersResolver {
  constructor(private readonly serversService: ServersService) {}

  @Query(() => [ServerType])
  async servers(@Context() context: GqlContext) {
    return this.serversService.findAll(context.req.user.sub);
  }

  @Query(() => ServerType)
  async server(
    @Args('id') id: string,
    @Context() context: GqlContext,
  ) {
    return this.serversService.findOne(id, context.req.user.sub);
  }

  @Mutation(() => ServerType)
  async createServer(
    @Args('input') input: CreateServerInput,
    @Context() context: GqlContext,
  ) {
    return this.serversService.create(input, context.req.user.sub);
  }

  @Mutation(() => ServerType)
  async updateServer(
    @Args('input') input: UpdateServerInput,
    @Context() context: GqlContext,
  ) {
    return this.serversService.update(input, context.req.user.sub);
  }

  @Mutation(() => ServerType)
  async deleteServer(
    @Args('id') id: string,
    @Context() context: GqlContext,
  ) {
    return this.serversService.remove(id, context.req.user.sub);
  }
}
```

### 5.4 Resolver 中的 this 问题

注意 `servers.resolver.ts` 中调用 `this.serversService` 的方式。由于 Resolver 也是由 NestJS DI 容器管理的，所以 `this` 是正确的 — 前提是：

1. `ServersResolver` 在 Module 的 `providers` 中注册
2. `ServersService` 也在该 Module 的 `providers` 中注册

### 5.5 创建 ServersModule

**文件**: [`src/servers/servers.module.ts`](src/servers/servers.module.ts)

```typescript
import { Module } from '@nestjs/common';
import { ServersService } from './servers.service.js';
import { ServersResolver } from './servers.resolver.js';

@Module({
  providers: [ServersService, ServersResolver],
  exports: [ServersService],
})
export class ServersModule {}
```

---

## 六、ApiKeys Module

### 6.1 设计思路

ApiKeys 用于 CI/CD 自动化调用，功能简单：
- 生成 API Key（随机字符串，hash 后存 DB，返回明文给用户）
- 列出所有 Key
- 删除 Key

### 6.2 Service 实现

**文件**: [`src/api-keys/api-keys.service.ts`](src/api-keys/api-keys.service.ts)

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    // 注意：不返回 key 字段本身（只显示前4位用于识别）
    const keys = await this.prisma.apiKey.findMany({
      where: { userId, active: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
        lastUsed: true,
        expiresAt: true,
        // 不返回 key 字段
      },
    });
    return keys;
  }

  async create(name: string, userId: string) {
    // 生成 API Key：cp_ 前缀 + 48 位随机字符
    const rawKey = `cp_${crypto.randomBytes(32).toString('hex')}`;
    const hashedKey = await bcrypt.hash(rawKey, 10);

    await this.prisma.apiKey.create({
      data: {
        name,
        key: hashedKey,
        userId,
      },
    });

    // 返回明文 key（仅此一次）
    return { name, key: rawKey };
  }

  async remove(id: string, userId: string) {
    const key = await this.prisma.apiKey.findFirst({
      where: { id, userId },
    });
    if (!key) throw new NotFoundException('API Key not found');

    await this.prisma.apiKey.update({
      where: { id },
      data: { active: false },
    });
    return { id, message: 'API Key revoked' };
  }
}
```

### 6.3 Resolver

**文件**: [`src/api-keys/api-keys.resolver.ts`](src/api-keys/api-keys.resolver.ts)

关键思路：
- `@UseGuards(GqlAuthGuard)` 保护所有操作
- `@Context()` 获取当前用户
- 返回类型用 @ObjectType 定义

---

## 七、AuditLog Module

### 7.1 设计思路

审计日志自动记录所有关键操作（创建 App、上传 Release、晋升、回滚等），由 Proxy Module 调用记录。

### 7.2 Service

```typescript
@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    userId: string;
    page?: number;
    limit?: number;
    action?: string;
  }) {
    const { userId, page = 1, limit = 20, action } = params;
    const where = { userId, ...(action ? { action } : {}) };

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async record(params: {
    userId: string;
    action: string;
    entity: string;
    entityId?: string;
    detail?: string;
    ip?: string;
  }) {
    return this.prisma.auditLog.create({ data: params });
  }
}
```

### 7.3 关键设计

`record` 方法应该被 **Proxy Module** 调用，而不是直接从 Resolver 调用。这样每次代理操作都自动记录审计日志。

---

## 八、Proxy Module（转发到 CodePush Server）

### 8.1 架构图

```
Client (Apollo Client)          NestJS BFF                   CodePush Server
       │                            │                             │
       │  Mutation: createApp        │                             │
       │───────────────────────────►│                             │
       │                            │                             │
       │                            ├── 1. 验证 JWT               │
       │                            ├── 2. 查找 Server            │
       │                            ├── 3. POST /apps             │
       │                            │    (HTTP 转发)              │
       │                            │────────────────────────────►│
       │                            │                             │
       │                            │◄────────────────────────────│
       │                            │    { id, name, ... }        │
       │                            │                             │
       │                            ├── 4. 记录审计日志           │
       │                            │                             │
       │◄───────────────────────────│                             │
       │    { id, name, ... }       │                             │
```

### 8.2 Proxy Service

**文件**: [`src/proxy/proxy.service.ts`](src/proxy/proxy.service.ts)

```typescript
import { Injectable, NotFoundException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';

@Injectable()
export class ProxyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  /**
   * 代理请求到 CodePush Server
   * @param serverId 服务器 ID
   * @param path API 路径，如 /apps
   * @param options fetch 配置
   * @param auditInfo 审计信息（可选）
   */
  async request<T>(
    serverId: string,
    path: string,
    options: RequestInit = {},
    auditInfo?: { userId: string; action: string; entity: string },
  ): Promise<T> {
    // 1. 查找 Server 配置
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
    });
    if (!server) throw new NotFoundException('Server not found');

    // 2. 构建请求 URL
    const url = `${server.baseUrl}/api${path}`;

    // 3. 发送请求
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': server.apiKey,
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`CodePush API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // 4. 记录审计日志（如果提供了 auditInfo）
    if (auditInfo) {
      await this.auditLog.record({
        userId: auditInfo.userId,
        action: auditInfo.action,
        entity: auditInfo.entity,
        entityId: (data as any)?.id,
        detail: JSON.stringify({ path, method: options.method || 'GET' }),
      });
    }

    return data as T;
  }
}
```

### 8.3 Proxy Resolver

**文件**: [`src/proxy/proxy.resolver.ts`](src/proxy/proxy.resolver.ts)

```typescript
import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ProxyService } from './proxy.service.js';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard.js';
import { GqlContext } from '../auth/dto/gql-context.js';

@Resolver()
@UseGuards(GqlAuthGuard)
export class ProxyResolver {
  constructor(private readonly proxyService: ProxyService) {}

  @Mutation(() => Boolean)
  async createApp(
    @Args('serverId') serverId: string,
    @Args('name') name: string,
    @Context() context: GqlContext,
  ) {
    const result = await this.proxyService.request(
      serverId,
      '/apps',
      {
        method: 'POST',
        body: JSON.stringify({ name }),
      },
      {
        userId: context.req.user.sub,
        action: 'CREATE_APP',
        entity: 'App',
      },
    );
    return result;
  }

  // ... 其他代理 Mutation
}
```

### 8.4 代理类型定义

对于每种 CodePush 资源，建议定义对应的 `@ObjectType`：

```typescript
@ObjectType()
export class CodePushApp {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field(() => [String], { nullable: true })
  deployments?: string[];
}

@ObjectType()
export class CodePushDeployment {
  @Field()
  name: string;

  @Field()
  key: string;
}

@ObjectType()
export class CodePushRelease {
  @Field()
  label: string;

  @Field()
  appVersion: string;

  @Field()
  description: string;

  @Field()
  size: number;

  @Field()
  uploadedAt: Date;
}
```

---

## 九、Module 注册与 AppModule 整合

### 9.1 最终 AppModule

**文件**: [`src/app.module.ts`](src/app.module.ts)

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ServersModule } from './servers/servers.module.js';
import { ApiKeysModule } from './api-keys/api-keys.module.js';
import { AuditLogModule } from './audit-log/audit-log.module.js';
import { ProxyModule } from './proxy/proxy.module.js';

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
    ApiKeysModule,
    AuditLogModule,
    ProxyModule,
  ],
})
export class AppModule {}
```

### 9.2 各 Module 导入注意事项

| Module | 需要导入的 Module | 说明 |
|--------|-------------------|------|
| AuthModule | PrismaModule（全局） | JwtModule + PassportModule |
| ServersModule | — | 只依赖 PrismaService（全局） |
| ApiKeysModule | — | 只依赖 PrismaService（全局） |
| AuditLogModule | — | 只依赖 PrismaService（全局） |
| ProxyModule | AuditLogModule | 需要注入 AuditLogService |

**关于全局 Module**: `PrismaModule` 使用了 `@Global()` 装饰器，所以它导出的 `PrismaService` 在所有 Module 中都可以直接注入，不需要在各 Module 中重复导入。

### 9.3 如果遇到 Circular Dependency

如果两个 Module 互相依赖，需要用 `forwardRef`：

```typescript
import { forwardRef, Module } from '@nestjs/common';

@Module({
  imports: [forwardRef(() => OtherModule)],
})
export class MyModule {}
```

但在 HyperPush 的场景中，不需要 forwardRef。

---

## 十、调试技巧与常见问题

### 10.1 常见错误与解决

| 错误信息 | 原因 | 解决 |
|---------|------|------|
| `Cannot determine GraphQL type` | 缺少 `@Field()` 或类型推导失败 | 检查所有 `@ObjectType` 和 `@InputType` 的字段是否有 `@Field()` |
| `"message": "Unauthorized"` | Token 无效或未传 | 检查 HTTP HEADERS 中是否有 `Authorization: Bearer <token>` |
| `"statusCode": 500, "message": "Internal server error"` | Resolver 抛出了未捕获异常 | 看终端日志，console.log 或加 try/catch |
| `Schema must contain uniquely named types but contains multiple types named "X"` | 类型名冲突 | 检查是否有两个 @ObjectType 用了相同的类名 |
| `"message": "Cannot return null for non-nullable field"` | 返回了 null 但字段声明为非空 | 检查 `@Field({ nullable: true })` 是否设置正确 |

### 10.2 调试步骤

启动服务后，按以下顺序测试：

```bash
# 1. 启动服务
bun run start:dev

# 2. 打开 GraphQL Playground
#    → http://localhost:3000/graphql

# 3. 测试注册
mutation { register(input: { email: "admin@test.com", password: "123456", name: "Admin" }) { accessToken user { id email } } }

# 4. 复制 accessToken，在 HTTP HEADERS 中设置
# { "Authorization": "Bearer <token>" }

# 5. 测试 me
query { me { id email name role } }

# 6. 测试 Servers
mutation { createServer(input: { name: "Prod", baseUrl: "http://code-push:3000", apiKey: "xxx" }) { id name baseUrl } }

query { servers { id name baseUrl isOnline } }
```

### 10.3 自动生成的 schema.gql

每次启动时，NestJS 会自动生成 `schema.gql` 文件（在项目根目录）。可以查看这个文件来确认你的 GraphQL Schema 是否正确：

```graphql
# 生成的 schema.gql 示例
type AuthPayload {
  accessToken: String!
  user: UserType!
}

type Mutation {
  register(input: RegisterInput!): AuthPayload!
  login(input: LoginInput!): AuthPayload!
  createServer(input: CreateServerInput!): ServerType!
  updateServer(input: UpdateServerInput!): ServerType!
  deleteServer(id: String!): ServerType!
  createApp(serverId: String!, name: String!): Boolean!
}

type Query {
  me: UserType!
  servers: [ServerType!]!
  server(id: String!): ServerType!
}

type UserType {
  id: String!
  email: String!
  name: String
  role: String!
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

### 10.4 推荐实现顺序

建议按以下顺序逐步实现，每个步骤完成后都启动服务测试：

```
Step 1: Auth Resolver + GqlAuthGuard
  → 测试 register/login/me 三个接口
  → 确认 JWT 认证流程正常

Step 2: Servers Resolver + Module
  → 测试 CRUD 四个接口
  → 确认 @UseGuards(GqlAuthGuard) 正常工作

Step 3: ApiKeys Module
  → 测试创建/列出/删除
  → 理解 hash 存 DB 的模式

Step 4: AuditLog Module
  → 测试分页查询
  → 确认记录功能正常

Step 5: Proxy Module
  → 先实现 HTTP 转发基础
  → 逐步添加 Apps/Deployments/Releases/AccessKeys 的代理
  → 集成审计日志记录
```

---

## 总结

完成以上步骤后，你将：

1. ✅ 掌握 `@nestjs/graphql` 的核心用法（@ObjectType、@InputType、@Resolver、@Mutation、@Query、@Args、@Context）
2. ✅ 理解 GQL AuthGuard 与普通 AuthGuard 的区别
3. ✅ 学会如何通过 BFF 代理转发请求到第三方服务
4. ✅ 掌握 NestJS Module 依赖注入的最佳实践
5. ✅ 会用 GraphQL Playground 调试所有接口

遇到问题时，先看自动生成的 `schema.gql` 确认 Schema 是否正确，再看终端日志中的错误堆栈。祝编码愉快！
