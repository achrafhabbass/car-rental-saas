import { SetMetadata } from '@nestjs/common';

export const ALLOW_NO_TENANT_KEY = 'allowNoTenant';

/// Marks a route as allowed for authenticated users WITHOUT a tenant context.
/// Typical usage: endpoints for SUPER_ADMIN or platform-level endpoints (tenant
/// management, platform billing) where there is no active tenant.
///
/// Plain authenticated users (with a tenantId in their JWT) still pass through.
export const AllowNoTenant = (): MethodDecorator & ClassDecorator =>
  SetMetadata(ALLOW_NO_TENANT_KEY, true);
