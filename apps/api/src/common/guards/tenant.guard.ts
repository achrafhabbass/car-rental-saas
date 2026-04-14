import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';

/**
 * TenantGuard enforces that:
 *   - the current request has a resolved tenantId in context, AND
 *   - the tenantId in the JWT matches the tenantId in the request context
 *     (when both are present), preventing tenant-crossing attacks.
 *
 * SUPER_ADMIN users are allowed to access any tenant.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const ctxTenantId = req.context?.tenantId;
    const user = req.user as { tenantId?: string; role?: string } | undefined;

    if (user?.role === 'SUPER_ADMIN') return true;

    if (!ctxTenantId) {
      throw new ForbiddenException('Tenant context is required for this resource');
    }

    if (user?.tenantId && user.tenantId !== ctxTenantId) {
      throw new ForbiddenException('Tenant mismatch between token and request');
    }

    return true;
  }
}
