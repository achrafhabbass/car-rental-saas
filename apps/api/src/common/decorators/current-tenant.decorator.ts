import { ExecutionContext, UnauthorizedException, createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';

/// Returns the resolved tenantId from the request context.
/// Throws UnauthorizedException if no tenant is associated with the request.
export const CurrentTenant = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  const req = ctx.switchToHttp().getRequest<Request>();
  const tenantId = req.context?.tenantId;
  if (!tenantId) {
    throw new UnauthorizedException('No tenant context for this request');
  }
  return tenantId;
});
