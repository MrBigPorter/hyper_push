import type { ExecutionContext } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Custom ThrottlerGuard that correctly extracts the client IP from the
 * GraphQL context (Express request) instead of the raw GraphQL context object.
 *
 * The default ThrottlerGuard's `getTracker(req)` calls `req.ip`, but in a
 * GraphQL context `req` is the GQL context object (which has no `ip`).
 * This guard extracts the underlying Express request via `ctx.getContext().req`.
 */
@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  /**
   * Override `getTracker` to resolve the real Express request from the
   * GraphQL context before accessing the IP.
   */
  override async getTracker(req: Record<string, unknown>): Promise<string> {
    // If we are in a GraphQL context, `req` is the GQL context object.
    // The Express request lives at `req.req` (the pattern used by NestJS
    // GraphQL when passing the request into the GraphQL context).
    const expressReq = (req.req as Record<string, unknown> | undefined) ?? req;
    return (expressReq.ip as string | undefined) ?? '';
  }

  /**
   * Override `getRequestResponse` so that when NestJS falls back to the
   * GraphQL code-path we still return the GQL context (required for the
   * parent class to work), but our overridden `getTracker` handles the
   * IP extraction correctly.
   */
  protected override getRequestResponse(context: ExecutionContext): {
    req: Record<string, unknown>;
    res: Record<string, unknown>;
  } {
    const httpRequest = context.switchToHttp().getRequest<Record<string, unknown>>();
    if (httpRequest?.ip) {
      return { req: httpRequest, res: context.switchToHttp().getResponse() };
    }

    // GraphQL path — return the GQL context as `req`; our `getTracker`
    // will drill into `req.req` to find the real Express request.
    const gqlCtx = GqlExecutionContext.create(context);
    const ctx = gqlCtx.getContext<Record<string, unknown>>();
    return {
      req: ctx,
      res: (ctx.res as Record<string, unknown>) ?? (ctx.req as Record<string, unknown>)?.res,
    };
  }
}
