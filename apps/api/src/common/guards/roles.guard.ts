import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '@prisma/client';
import type { Request } from 'express';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Enforces role-based access control.
 * - Routes with @Public() are skipped.
 * - Routes without @Roles() are allowed for any authenticated user.
 * - Routes with @Roles(...) require req.user.role ∈ allowed, with SUPER_ADMIN
 *   bypassing every role check.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const required = this.reflector.getAllAndOverride<UserRole[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const user = req.user as { role?: UserRole } | undefined;
    if (!user?.role) {
      throw new ForbiddenException('No authenticated user for role check');
    }

    if (user.role === 'SUPER_ADMIN') return true;
    if (required.includes(user.role)) return true;

    throw new ForbiddenException(
      `Role ${user.role} is not allowed; required one of ${required.join(', ')}`,
    );
  }
}
