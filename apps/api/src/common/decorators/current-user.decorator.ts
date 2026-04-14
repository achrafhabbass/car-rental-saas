import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';

import type { JwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';

/// Returns the authenticated user (JWT payload) attached by JwtStrategy.
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext): JwtPayload | JwtPayload[keyof JwtPayload] => {
    const req = ctx.switchToHttp().getRequest<Request & { user: JwtPayload }>();
    const user = req.user;
    return data ? user?.[data] : user;
  },
);
