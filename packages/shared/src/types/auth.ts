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
  phone: string | null;
  billingEmail: string | null;
  address: string | null;
  city: string | null;
  website: string | null;
  logoUrl: string | null;
  taxId: string | null;
  ice: string | null;
  rc: string | null;
  patente: string | null;
  cnss: string | null;
  bankName: string | null;
  bankRib: string | null;
}

export interface UpdateTenantSelfInput {
  name?: string;
  phone?: string;
  billingEmail?: string;
  address?: string;
  city?: string;
  website?: string;
  logoUrl?: string;
  taxId?: string;
  ice?: string;
  rc?: string;
  patente?: string;
  cnss?: string;
  bankName?: string;
  bankRib?: string;
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
