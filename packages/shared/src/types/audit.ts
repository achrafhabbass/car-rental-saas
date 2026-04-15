export type PlatformAuditActionName =
  | 'IMPERSONATE'
  | 'TENANT_UPDATE'
  | 'TENANT_SUSPEND'
  | 'TENANT_ACTIVATE'
  | 'TENANT_CANCEL'
  | 'TENANT_DELETE'
  | 'TENANT_EXTEND_TRIAL'
  | 'TENANT_EXTEND_SUBSCRIPTION'
  | 'SWEEP_EXPIRIES';

export interface PlatformAuditLogDto {
  id: string;
  action: PlatformAuditActionName;
  actorUserId: string | null;
  tenantId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface ImpersonateResponseDto {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
  tenantId: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  tenant: { id: string; name: string; slug: string };
}
