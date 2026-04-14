import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { NextFunction, Request, Response } from 'express';

import type { JwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';

/// Augments Express.Request with tenant + auth context.
export interface RequestContext {
  tenantId?: string;
  userId?: string;
  role?: string;
}

declare module 'express' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Request {
    context?: RequestContext;
  }
}

/**
 * TenantMiddleware resolves the active tenant for the current request.
 *
 * Resolution order (first match wins):
 *   1. JWT access token (`tenantId` claim) — the default strategy.
 *   2. Explicit `x-tenant-id` header (override, for trusted admin tooling).
 *   3. Subdomain parsing (e.g. acme.autosphere.app → slug=acme).
 *
 * The resolved tenantId is attached to `req.context.tenantId` and later
 * enforced by the TenantGuard on protected routes.
 *
 * Note: this middleware does NOT reject requests without a tenant — some
 * routes (login, register, health) are legitimately tenant-less. The
 * TenantGuard is responsible for enforcing tenant presence per route.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);
  private readonly tenantHeader: string;

  constructor(private readonly config: ConfigService, private readonly jwtService: JwtService) {
    this.tenantHeader = (config.get<string>('tenant.header') ?? 'x-tenant-id').toLowerCase();
  }

  use(req: Request, _res: Response, next: NextFunction): void {
    const context: RequestContext = {};

    const fromJwt = this.extractFromJwt(req);
    if (fromJwt) {
      context.tenantId = fromJwt.tenantId;
      context.userId = fromJwt.userId;
      context.role = fromJwt.role;
    }

    if (!context.tenantId) {
      const headerValue = req.headers[this.tenantHeader];
      if (typeof headerValue === 'string' && headerValue.trim().length > 0) {
        context.tenantId = headerValue.trim();
      }
    }

    if (!context.tenantId) {
      const subdomain = this.extractSubdomain(req);
      if (subdomain) {
        context.tenantId = subdomain;
      }
    }

    req.context = context;
    next();
  }

  private extractFromJwt(
    req: Request,
  ): { tenantId?: string; userId?: string; role?: string } | null {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) return null;

    try {
      const secret = this.config.get<string>('jwt.accessSecret');
      const payload = this.jwtService.verify<JwtPayload>(token, { secret });
      return {
        tenantId: payload.tenantId ?? undefined,
        userId: payload.sub,
        role: payload.role,
      };
    } catch {
      // Token invalid/expired — leave context empty; JwtAuthGuard will reject
      return null;
    }
  }

  private extractSubdomain(req: Request): string | undefined {
    const host = req.headers.host;
    if (!host) return undefined;
    const parts = host.split(':')[0].split('.');
    if (parts.length < 3) return undefined;
    const reserved = new Set(['www', 'api', 'admin', 'app']);
    const candidate = parts[0].toLowerCase();
    return reserved.has(candidate) ? undefined : candidate;
  }
}
