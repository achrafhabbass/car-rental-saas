import type { ApiEnvelope, ApiErrorEnvelope, AuthTokensDto } from '@autosphere/shared';

import { session } from './session';

// In the browser, use relative URL so requests go through the Next.js proxy
// (rewrites in next.config.mjs forward /api/v1/* to the backend).
// On the server (SSR), use the full URL.
const API_URL =
  typeof window !== 'undefined'
    ? '/api/v1'
    : (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4001/api/v1');

export class ApiError extends Error {
  /** Set to 'PLAN_LIMIT_EXCEEDED' when the error is a plan quota violation. */
  public readonly errorCode: string | undefined;
  /** Extra payload for structured errors (e.g. resource, current, limit, plan, upgrade). */
  public readonly extra: Record<string, unknown> | undefined;

  constructor(
    public readonly status: number,
    public readonly body: ApiErrorEnvelope,
  ) {
    super(Array.isArray(body.message) ? body.message.join(', ') : body.message);
    this.name = 'ApiError';
    const raw = body as unknown as Record<string, unknown>;
    if (raw.error === 'PLAN_LIMIT_EXCEEDED') {
      this.errorCode = 'PLAN_LIMIT_EXCEEDED';
      this.extra = raw;
    }
  }

  get isPlanLimit(): boolean {
    return this.errorCode === 'PLAN_LIMIT_EXCEEDED';
  }
}

export interface ApiOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  token?: string;
  tenantId?: string;
  skipAuth?: boolean;
  /// Internal: set by the retry path to prevent refresh loops on repeated 401s.
  _retry?: boolean;
}

/**
 * Single-flight refresh: concurrent 401s from multiple in-flight requests
 * share a single /auth/refresh call, so the refresh token only rotates once.
 */
let refreshInFlight: Promise<string | null> | null = null;
let onUnauthorizedHandler: (() => void) | null = null;

export function setOnUnauthorized(fn: (() => void) | null): void {
  onUnauthorizedHandler = fn;
}

async function performRefresh(): Promise<string | null> {
  const refreshToken = session.getRefreshToken();
  if (!refreshToken) return null;

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    session.clear();
    return null;
  }

  const payload = (await res.json()) as ApiEnvelope<AuthTokensDto>;
  session.setTokens({
    accessToken: payload.data.accessToken,
    refreshToken: payload.data.refreshToken,
  });
  return payload.data.accessToken;
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = performRefresh().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { body, token, tenantId, skipAuth, headers, _retry, ...rest } = options;
  const url = path.startsWith('http') ? path : `${API_URL}${path}`;

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(headers as Record<string, string> | undefined),
  };

  const effectiveToken = token ?? (skipAuth ? null : session.getAccessToken());
  if (effectiveToken) finalHeaders.Authorization = `Bearer ${effectiveToken}`;

  const effectiveTenant = tenantId ?? session.getTenantId();
  if (effectiveTenant) finalHeaders['x-tenant-id'] = effectiveTenant;

  const res = await fetch(url, {
    ...rest,
    headers: finalHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await res.text();
  const payload = text ? (JSON.parse(text) as unknown) : null;

  if (!res.ok) {
    // Attempt one transparent refresh on 401 for authenticated routes.
    if (res.status === 401 && !skipAuth && !_retry) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        return apiFetch<T>(path, { ...options, _retry: true });
      }
      // Refresh failed → clear session and notify the UI layer
      session.clear();
      if (onUnauthorizedHandler) onUnauthorizedHandler();
    }
    throw new ApiError(res.status, payload as ApiErrorEnvelope);
  }

  if (payload === null) return undefined as T;
  return (payload as ApiEnvelope<T>).data;
}

export const api = {
  get: <T>(path: string, opts?: ApiOptions) =>
    apiFetch<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body?: unknown, opts?: ApiOptions) =>
    apiFetch<T>(path, { ...opts, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, opts?: ApiOptions) =>
    apiFetch<T>(path, { ...opts, method: 'PATCH', body }),
  delete: <T>(path: string, opts?: ApiOptions) =>
    apiFetch<T>(path, { ...opts, method: 'DELETE' }),
};

/// Triggers a browser download for an authenticated file endpoint.
/// Fetches the response as text (CSV), wraps it in a blob, and clicks an
/// invisible anchor so the browser saves the file. Uses the same Authorization
/// + tenant headers as the rest of the API client.
export async function downloadFile(
  path: string,
  filename: string,
): Promise<void> {
  const url = path.startsWith('http') ? path : `${API_URL}${path}`;
  const headers: Record<string, string> = { Accept: 'text/csv' };
  const token = session.getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const tenant = session.getTenantId();
  if (tenant) headers['x-tenant-id'] = tenant;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new ApiError(res.status, {
      statusCode: res.status,
      message: res.statusText,
      error: 'DownloadFailed',
      path,
      timestamp: new Date().toISOString(),
    });
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
