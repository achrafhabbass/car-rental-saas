export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  tenantId?: string;
}

export interface RegisterRequest {
  companyName: string;
  companySlug: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthenticatedUser {
  userId: string;
  tenantId: string | null;
  email: string;
  role: UserRoleName;
}

export type UserRoleName =
  | 'SUPER_ADMIN'
  | 'OWNER'
  | 'MANAGER'
  | 'AGENT'
  | 'ACCOUNTANT'
  | 'VIEWER';
