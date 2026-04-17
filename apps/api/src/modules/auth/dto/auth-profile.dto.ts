import type { Tenant, User, UserRole, UserStatus } from '@prisma/client';

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

export interface AuthProfileDto {
  id: string;
  tenantId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  mfaEnabled: boolean;
  mustChangePassword: boolean;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  tenant: AuthProfileTenantDto | null;
}

export function toAuthProfile(
  user: User,
  tenant: Tenant | null = null,
): AuthProfileDto {
  return {
    id: user.id,
    tenantId: user.tenantId,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    status: user.status,
    mfaEnabled: user.mfaEnabled,
    mustChangePassword: user.mustChangePassword,
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    tenant: tenant
      ? {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          status: tenant.status,
          plan: tenant.plan ?? null,
          phone: tenant.phone ?? null,
          billingEmail: tenant.billingEmail ?? null,
          address: tenant.address ?? null,
          city: tenant.city ?? null,
          website: tenant.website ?? null,
          logoUrl: tenant.logoUrl ?? null,
          taxId: tenant.taxId ?? null,
          ice: tenant.ice ?? null,
          rc: tenant.rc ?? null,
          patente: tenant.patente ?? null,
          cnss: tenant.cnss ?? null,
          bankName: tenant.bankName ?? null,
          bankRib: tenant.bankRib ?? null,
        }
      : null,
  };
}
