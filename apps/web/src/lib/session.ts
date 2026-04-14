const ACCESS_KEY = 'autosphere.accessToken';
const REFRESH_KEY = 'autosphere.refreshToken';
const TENANT_KEY = 'autosphere.tenantId';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
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
  set(input: { accessToken: string; refreshToken: string; tenantId: string | null }): void {
    if (!isBrowser()) return;
    window.localStorage.setItem(ACCESS_KEY, input.accessToken);
    window.localStorage.setItem(REFRESH_KEY, input.refreshToken);
    if (input.tenantId) window.localStorage.setItem(TENANT_KEY, input.tenantId);
  },
  clear(): void {
    if (!isBrowser()) return;
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
    window.localStorage.removeItem(TENANT_KEY);
  },
};
