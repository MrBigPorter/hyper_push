import { UseGuards } from '@nestjs/common';
import { Args, Context, Field, Mutation, ObjectType, Query, Resolver } from '@nestjs/graphql';
import {
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
  UpdateUserInput,
  Verify2faInput,
} from '@/auth/dto';
import { GqlAuthGuard } from '@/auth/guards/gql-auth.guard.js';
import { AuthService } from './auth.service.js';
import { AuthModel } from './models/auth.model.js';
import { UserModel } from './models/user.model.js';
import { TwoFactorService } from './two-factor.service.js';

/**
 * Extract the real IP from a GraphQL context request.
 * Respects X-Forwarded-For, X-Real-IP, and falls back to connection.remoteAddress.
 */
function extractIp(req: Record<string, unknown>): string | undefined {
  return (
    (req['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
    (req['x-real-ip'] as string | undefined) ??
    ((req.connection as Record<string, unknown> | undefined)?.remoteAddress as string | undefined)
  );
}

/** Shape for paginated user list (admin) */
@ObjectType('PaginatedUsers')
class PaginatedUsers {
  @Field(() => [UserModel])
  items!: UserModel[];

  @Field()
  total!: number;

  @Field()
  page!: number;

  @Field()
  limit!: number;
}

@Resolver()
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  // ========================
  //  Public mutations
  // ========================

  @Mutation(() => AuthModel)
  async login(
    @Args('input', { type: () => LoginInput }) input: LoginInput,
    @Context() ctx: {
      req: { headers: Record<string, string>; connection?: { remoteAddress: string } };
    },
  ) {
    const ip = extractIp(ctx.req as unknown as Record<string, unknown>);
    const userAgent = ctx.req.headers?.['user-agent'];
    return this.authService.login(input, { ip, userAgent });
  }

  @Mutation(() => AuthModel)
  async register(@Args('input', { type: () => RegisterInput }) input: RegisterInput) {
    return this.authService.register(input);
  }

  // ========================
  //  2FA mutations (authenticated)
  // ========================

  /**
   * Step 1: Generate a TOTP secret and return the otpauth:// URI
   * so the frontend can render a QR code.
   */
  @Mutation(() => String, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async setup2fa(@Context() ctx: { req: { user: { sub: string } } }) {
    const result = await this.twoFactorService.generateSecret(ctx.req.user.sub);
    return result.uri;
  }

  /**
   * Step 2: Enable 2FA after user has scanned the QR code and
   * verified a TOTP token.
   */
  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async enable2fa(
    @Context() ctx: { req: { user: { sub: string } } },
    @Args('token') token: string,
  ) {
    return this.twoFactorService.enable2fa(ctx.req.user.sub, token);
  }

  /**
   * Disable 2FA. Requires password + TOTP token if 2FA is active.
   */
  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async disable2fa(
    @Context() ctx: { req: { user: { sub: string } } },
    @Args('password') password: string,
    @Args('token', { nullable: true }) token?: string,
  ) {
    return this.twoFactorService.disable2fa(ctx.req.user.sub, password, token);
  }

  /**
   * Complete 2FA login: verify TOTP token and exchange temp token
   * for full access token.
   */
  @Mutation(() => AuthModel)
  async verify2fa(@Args('input', { type: () => Verify2faInput }) input: Verify2faInput) {
    return this.authService.verify2fa(input.tempToken, input.token);
  }

  /**
   * Change password. If 2FA is enabled, TOTP token is required.
   */
  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async changePassword(
    @Context() ctx: { req: { user: { sub: string } } },
    @Args('input', { type: () => ChangePasswordInput }) input: ChangePasswordInput,
  ) {
    return this.authService.changePassword(
      ctx.req.user.sub,
      input.currentPassword,
      input.newPassword,
      input.totpToken,
    );
  }

  // ========================
  //  Query (authenticated)
  // ========================

  @Query(() => UserModel)
  @UseGuards(GqlAuthGuard)
  async me(@Context() ctx: { req: { user: { sub: string } } }) {
    return this.authService.getMe(ctx.req.user.sub);
  }

  // ========================
  //  Admin mutations
  // ========================

  @Mutation(() => UserModel)
  @UseGuards(GqlAuthGuard)
  async updateUser(@Args('input', { type: () => UpdateUserInput }) input: UpdateUserInput) {
    return this.authService.updateUser(input);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async banUser(
    @Context() ctx: { req: { user: { sub: string; role: string } } },
    @Args('userId') userId: string,
    @Args('reason', { nullable: true }) reason?: string,
  ) {
    if (ctx.req.user.role !== 'admin') {
      throw new Error('Only admins can ban users');
    }
    return this.authService.banUser(userId, reason);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async unbanUser(
    @Context() ctx: { req: { user: { sub: string; role: string } } },
    @Args('userId') userId: string,
  ) {
    if (ctx.req.user.role !== 'admin') {
      throw new Error('Only admins can unban users');
    }
    return this.authService.unbanUser(userId);
  }

  // ========================
  //  Admin queries
  // ========================

  @Query(() => PaginatedUsers)
  @UseGuards(GqlAuthGuard)
  async listUsers(
    @Context() ctx: { req: { user: { sub: string; role: string } } },
    @Args('page', { nullable: true, type: () => Number }) page?: number,
    @Args('limit', { nullable: true, type: () => Number }) limit?: number,
    @Args('sortBy', { nullable: true }) sortBy?: string,
    @Args('sortOrder', { nullable: true }) sortOrder?: string,
    @Args('search', { nullable: true }) search?: string,
  ) {
    if (ctx.req.user.role !== 'admin') {
      throw new Error('Only admins can list users');
    }
    return this.authService.listUsers({
      page,
      limit,
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc' | undefined,
      search,
    });
  }
}
