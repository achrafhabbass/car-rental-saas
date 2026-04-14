import type { UserRole } from '@prisma/client';

/// Payload embedded in access tokens.
export interface JwtPayload {
  sub: string; // userId
  email: string;
  tenantId: string | null;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/// Payload embedded in refresh tokens. Kept minimal intentionally.
export interface JwtRefreshPayload {
  sub: string; // userId
  jti: string; // refresh token id — used for revocation
  tenantId: string | null;
  iat?: number;
  exp?: number;
}

/// Returned to clients after login / refresh.
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
}
