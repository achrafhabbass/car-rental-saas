import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { ALLOW_NO_TENANT_KEY } from '../decorators/allow-no-tenant.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Global guard enforcing multi-tenant isolation.
 *
 * Rules:
 *   - @Public() routes skip this guard entirely.
 *   - SUPER_ADMIN can access any tenant (their tenantId may be null).
 *   - @AllowNoTenant() routes allow authenticated users without a tenant context.
 *   - Otherwise, req.context.tenantId MUST match req.user.tenantId.
 *   - Tenant context without matching JWT tenantId is rejected — this blocks
 *     the "change x-tenant-id header to escalate to another tenant" attack.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const user = req.user as { tenantId?: string | null; role?: string } | undefined;

    if (user?.role === 'SUPER_ADMIN') return true;

    const allowNoTenant = this.reflector.getAllAndOverride<boolean>(
      ALLOW_NO_TENANT_KEY,
      [context.getHandler(), context.getClass()],
    );

    const ctxTenantId = req.context?.tenantId;
    const userTenantId = user?.tenantId ?? null;

    if (!userTenantId) {
      if (allowNoTenant) return true;
      throw new ForbiddenException('User is not associated with any tenant');
    }

    // A tenant is present on the user: ensure the request context uses that
    // exact tenant. Set it for downstream code if the middleware didn't.
    if (!ctxTenantId) {
      req.context = { ...(req.context ?? {}), tenantId: userTenantId };
      return true;
    }

    if (ctxTenantId !== userTenantId) {
      throw new ForbiddenException('Tenant mismatch between token and request');
    }

    return true;
  }
}
