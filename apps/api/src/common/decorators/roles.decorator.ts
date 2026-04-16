import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/// Restricts a route to users whose role is in the given list.
/// SUPER_ADMIN always passes regardless.
/// Use with RolesGuard (registered globally via APP_GUARD).
///
/// Example:
///   @Roles('ADMIN', 'MANAGER')
///   @Post()
///   create(...) { ... }
export const Roles = (...roles: UserRole[]): ClassDecorator & MethodDecorator =>
  SetMetadata(ROLES_KEY, roles);
