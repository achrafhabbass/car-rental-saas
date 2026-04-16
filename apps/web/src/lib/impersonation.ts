import type { AuthProfileDto, ImpersonateResponseDto } from '@autosphere/shared';

import { session } from './session';

const ORIGINAL_ACCESS = 'autosphere.originalAccessToken';
const ORIGINAL_REFRESH = 'autosphere.originalRefreshToken';
const ORIGINAL_TENANT = 'autosphere.originalTenantId';
const ORIGINAL_USER = 'autosphere.originalUser';
const IMPERSONATION_CTX = 'autosphere.impersonation';

export interface ImpersonationContext {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  impersonatedUser: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  startedAt: string;
}

function browser(): boolean {
  return typeof window !== 'undefined';
}

/// Swap the current super-admin session for an impersonation session.
/// Stores the super-admin's tokens + profile as "original" so the banner's
/// "Return to platform" button can restore them atomically.
export function enterImpersonation(result: ImpersonateResponseDto): void {
  if (!browser()) return;
  const ls = window.localStorage;

  // Backup current super-admin session
  const curAccess = session.getAccessToken();
  const curRefresh = session.getRefreshToken();
  const curTenant = session.getTenantId();
  const curUser = session.getUser();
  if (curAccess) ls.setItem(ORIGINAL_ACCESS, curAccess);
  if (curRefresh) ls.setItem(ORIGINAL_REFRESH, curRefresh);
  if (curTenant) ls.setItem(ORIGINAL_TENANT, curTenant);
  if (curUser) ls.setItem(ORIGINAL_USER, JSON.stringify(curUser));

  // Swap in impersonation tokens
  session.setTokens({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    tenantId: result.tenantId,
  });
  // Clear user so auth context refetches /me against the impersonated user
  session.setUser(null);

  const ctx: ImpersonationContext = {
    tenantId: result.tenant.id,
    tenantName: result.tenant.name,
    tenantSlug: result.tenant.slug,
    impersonatedUser: {
      id: result.user.id,
      email: result.user.email,
      firstName: result.user.firstName,
      lastName: result.user.lastName,
    },
    startedAt: new Date().toISOString(),
  };
  ls.setItem(IMPERSONATION_CTX, JSON.stringify(ctx));
}

export function getImpersonationContext(): ImpersonationContext | null {
  if (!browser()) return null;
  const raw = window.localStorage.getItem(IMPERSONATION_CTX);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ImpersonationContext;
  } catch {
    return null;
  }
}

/// Restore the super-admin session. Returns true if a backup was found.
export function exitImpersonation(): boolean {
  if (!browser()) return false;
  const ls = window.localStorage;
  const access = ls.getItem(ORIGINAL_ACCESS);
  const refresh = ls.getItem(ORIGINAL_REFRESH);
  const tenant = ls.getItem(ORIGINAL_TENANT);
  const userRaw = ls.getItem(ORIGINAL_USER);
  if (!access || !refresh) return false;

  session.setTokens({
    accessToken: access,
    refreshToken: refresh,
    tenantId: tenant,
  });
  session.setUser(userRaw ? (JSON.parse(userRaw) as AuthProfileDto) : null);

  ls.removeItem(ORIGINAL_ACCESS);
  ls.removeItem(ORIGINAL_REFRESH);
  ls.removeItem(ORIGINAL_TENANT);
  ls.removeItem(ORIGINAL_USER);
  ls.removeItem(IMPERSONATION_CTX);
  return true;
}
