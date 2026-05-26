import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { Sentry } from '../sentry/sentry';

interface AuthedRequest extends Request {
  user?: { id?: string; tenantId?: string | null; role?: string };
  tenantId?: string;
}

interface ErrorResponseBody {
  statusCode: number;
  message: string | string[];
  error: string;
  path: string;
  timestamp: string;
  requestId?: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<AuthedRequest>();

    const { status, message, error } = this.extractError(exception);

    const body: ErrorResponseBody = {
      statusCode: status,
      message,
      error,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    if (status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} → ${status} ${error}`,
        exception instanceof Error ? exception.stack : undefined,
      );
      // Forward to Sentry. No-op when SENTRY_DSN is unset.
      Sentry.withScope((scope) => {
        scope.setTag('http.method', request.method);
        scope.setTag('http.status', String(status));
        scope.setContext('request', {
          url: request.url,
          method: request.method,
        });
        const tenantId = request.user?.tenantId ?? request.tenantId;
        if (tenantId) scope.setTag('tenant', tenantId);
        if (request.user?.id) {
          scope.setUser({ id: request.user.id });
        }
        Sentry.captureException(exception);
      });
    } else {
      this.logger.warn(`[${request.method}] ${request.url} → ${status} ${error}`);
    }

    // For structured errors (e.g. PLAN_LIMIT_EXCEEDED), pass through
    // extra fields so the frontend gets resource/current/limit/plan/upgrade.
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null && 'error' in res) {
        const structured = res as Record<string, unknown>;
        if (structured.error === 'PLAN_LIMIT_EXCEEDED') {
          response.status(status).json({
            ...structured,
            statusCode: status,
            path: request.url,
            timestamp: new Date().toISOString(),
          });
          return;
        }
      }
    }

    response.status(status).json(body);
  }

  private extractError(exception: unknown): { status: number; message: string | string[]; error: string } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        return { status, message: res, error: exception.name };
      }
      const obj = res as { message?: string | string[]; error?: string };
      return {
        status,
        message: obj.message ?? exception.message,
        error: obj.error ?? exception.name,
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'InternalServerError',
    };
  }
}
