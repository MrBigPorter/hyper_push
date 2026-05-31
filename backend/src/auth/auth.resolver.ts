import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginInput, RegisterInput, UpdateUserInput } from '@/auth/dto';
import { AuthModel } from './models/auth.model.js';
import { UserModel } from './models/user.model.js';
import { GqlAuthGuard } from '@/auth/guards/gql-auth.guard.js';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthModel)
  async login(
    @Args('input', { type: () => LoginInput }) input: LoginInput,
  ) {
    return this.authService.login(input);
  }

  @Mutation(() => AuthModel)
  async register(
    @Args('input', { type: () => RegisterInput }) input: RegisterInput,
  ) {
    return this.authService.register(input);
  }

  @Mutation(() => UserModel)
  @UseGuards(GqlAuthGuard)
  async updateUser(
    @Args('input', { type: () => UpdateUserInput }) input: UpdateUserInput,
  ) {
    return this.authService.updateUser(input);
  }

  @Query(() => UserModel)
  @UseGuards(GqlAuthGuard)
  async me(
    @Context() ctx: { req: { user: { sub: string } } },
  ) {
    return this.authService.getMe(ctx.req.user.sub);
  }
}
