import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service.js';
import { CreateApiKeyInput } from '@/api-keys/dto';
import { ApiKeyModel } from './models/api-key.model.js';
import { GqlAuthGuard } from '@/auth/guards/gql-auth.guard.js';

@Resolver(() => ApiKeyModel)
@UseGuards(GqlAuthGuard)
export class ApiKeysResolver {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Query(() => [ApiKeyModel])
  async getApiKeys(@Context() ctx: { req: { user: { sub: string } } }) {
    return this.apiKeysService.findAll(ctx.req.user.sub);
  }

  @Mutation(() => ApiKeyModel)
  async createApiKey(
    @Args('input', { type: () => CreateApiKeyInput }) input: CreateApiKeyInput,
    @Context() ctx: { req: { user: { sub: string } } },
  ) {
    return this.apiKeysService.create(input, ctx.req.user.sub);
  }

  @Mutation(() => Boolean)
  async deleteApiKey(
    @Args('id') id: string,
    @Context() ctx: { req: { user: { sub: string } } },
  ) {
    await this.apiKeysService.remove(id, ctx.req.user.sub);
    return true;
  }
}
