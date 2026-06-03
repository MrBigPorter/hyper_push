import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GqlAuthGuard } from '@/auth/guards/gql-auth.guard.js';
import { CreateServerInput, UpdateServerInput } from '@/servers/dto';
import { ServerModel } from './models/server.model.js';
import type { ServersService } from './servers.service.js';

@Resolver(() => ServerModel)
@UseGuards(GqlAuthGuard)
export class ServersResolver {
  constructor(private readonly serversService: ServersService) {}

  @Query(() => [ServerModel])
  async getServers(@Context() ctx: { req: { user: { sub: string } } }) {
    return this.serversService.findAll(ctx.req.user.sub);
  }

  @Query(() => ServerModel, { name: 'server' })
  async getServer(@Args('id') id: string, @Context() ctx: { req: { user: { sub: string } } }) {
    return this.serversService.findOne(id, ctx.req.user.sub);
  }

  @Mutation(() => ServerModel)
  async createServer(
    @Args('input', { type: () => CreateServerInput }) input: CreateServerInput,
    @Context() ctx: { req: { user: { sub: string } } },
  ) {
    return this.serversService.create(input, ctx.req.user.sub);
  }

  @Mutation(() => ServerModel)
  async updateServer(
    @Args('input', { type: () => UpdateServerInput }) input: UpdateServerInput,
    @Context() ctx: { req: { user: { sub: string } } },
  ) {
    return this.serversService.update(input, ctx.req.user.sub);
  }

  @Mutation(() => Boolean)
  async deleteServer(@Args('id') id: string, @Context() ctx: { req: { user: { sub: string } } }) {
    await this.serversService.remove(id, ctx.req.user.sub);
    return true;
  }
}
