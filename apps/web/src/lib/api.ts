import type { ApiEnvelope, ApiErrorEnvelope } from '@autosphere/shared';

import { session } from './session';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4001/api/v1';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ApiErrorEnvelope,
  ) {
    super(Array.isArray(body.message) ? body.message.join(', ') : body.message);
    this.name = 'ApiError';
  }
}

export interface ApiOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  token?: string;
  tenantId?: string;
  skipAuth?: boolean;
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { body, token, tenantId, skipAuth, headers, ...rest } = options;
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
