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
  | 'ADMIN'
  | 'MANAGER'
  | 'EMPLOYEE'
  | 'ACCOUNTANT';

export interface AuthProfileTenantDto {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string | null;
}

export interface AuthProfileDto {
  id: string;
  tenantId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRoleName;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED' | 'DISABLED';
  mfaEnabled: boolean;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  tenant: AuthProfileTenantDto | null;
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}
