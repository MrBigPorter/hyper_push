import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { GqlContextType } from '@nestjs/graphql';
import type { Request, Response } from 'express';
import { GraphQLError } from 'graphql';

/**
 * Global exception filter that:
 * - Sanitizes error messages in production (no stack trace leakage)
 * - Handles both GraphQL and REST contexts
 * - Adds a requestId for log correlation
 * - Logs all errors server-side with full stack traces
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const gqlContext = host.getType<GqlContextType>() === 'graphql';
    const requestId = this.generateRequestId();

    // Determine HTTP status and message
    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      const res = exception.getResponse();
      const responseBody = res as Record<string, unknown>;
      const responseMessage = responseBody?.message;
      message =
        typeof res === 'string'
          ? res
          : Array.isArray(responseMessage)
            ? ((responseMessage as string[])[0] ?? 'Unknown error')
            : typeof responseMessage === 'string'
              ? responseMessage
              : ((responseBody?.error as string | undefined) ?? 'Unknown error');
    }

    // Log every error with requestId for server-side traceability
    this.logger.error(
      `[${requestId}] ${httpStatus} ${gqlContext ? 'GraphQL' : 'HTTP'} — ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    if (gqlContext) {
      // GraphQL: throw GraphQLError -> Apollo formats the response
      throw new GraphQLError(httpStatus >= 500 ? 'Internal server error' : message, {
        extensions: {
          code: httpStatus >= 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_USER_INPUT',
          http: { status: httpStatus },
          requestId,
        },
      });
    }

    // REST: return JSON response
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (!response.headersSent) {
      response.status(httpStatus).json({
        statusCode: httpStatus,
        message: httpStatus >= 500 ? 'Internal server error' : message,
        requestId,
        path: request.url,
      });
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }
}
