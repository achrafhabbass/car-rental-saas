import type { AuthProfileDto } from '@autosphere/shared';

const ACCESS_KEY = 'autosphere.accessToken';
const REFRESH_KEY = 'autosphere.refreshToken';
const TENANT_KEY = 'autosphere.tenantId';
const USER_KEY = 'autosphere.user';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export interface StoredSession {
  accessToken: string;
  refreshToken: string;
  tenantId: string | null;
  user?: AuthProfileDto | null;
}

export const session = {
  getAccessToken(): string | null {
    return isBrowser() ? window.localStorage.getItem(ACCESS_KEY) : null;
  },
  getRefreshToken(): string | null {
    return isBrowser() ? window.localStorage.getItem(REFRESH_KEY) : null;
  },
  getTenantId(): string | null {
    return isBrowser() ? window.localStorage.getItem(TENANT_KEY) : null;
  },
  getUser(): AuthProfileDto | null {
    if (!isBrowser()) return null;
    const raw = window.localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthProfileDto;
    } catch {
      return null;
    }
  },
  setTokens(input: {
    accessToken: string;
    refreshToken: string;
    tenantId?: string | null;
  }): void {
    if (!isBrowser()) return;
    window.localStorage.setItem(ACCESS_KEY, input.accessToken);
    window.localStorage.setItem(REFRESH_KEY, input.refreshToken);
    if (input.tenantId !== undefined && input.tenantId !== null) {
      window.localStorage.setItem(TENANT_KEY, input.tenantId);
    }
  },
  setUser(user: AuthProfileDto | null): void {
    if (!isBrowser()) return;
    if (user) window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    else window.localStorage.removeItem(USER_KEY);
  },
  set(full: StoredSession): void {
    this.setTokens(full);
    if (full.user !== undefined) this.setUser(full.user ?? null);
  },
  clear(): void {
    if (!isBrowser()) return;
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
    window.localStorage.removeItem(TENANT_KEY);
    window.localStorage.removeItem(USER_KEY);
  },
};
