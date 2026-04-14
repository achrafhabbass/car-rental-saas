import type { TenantPlanName, TenantStatusName } from './tenant';

export interface PlatformMetricsDto {
  tenants: {
    total: number;
    active: number;
    trial: number;
    suspended: number;
    cancelled: number;
  };
  users: { total: number };
  fleet: { total: number };
  contracts: { active: number };
  revenue: { mrrApprox: number };
  expiring: { days7: number; days30: number };
  byPlan: Record<string, number>;
}

export interface TenantSummaryDto {
  id: string;
  name: string;
  slug: string;
  status: TenantStatusName;
  plan: TenantPlanName;
  billingEmail: string | null;
  subscriptionEnd: string | null;
  trialEndsAt: string | null;
  createdAt: string;
  userCount: number;
  vehicleCount: number;
  activeContractCount: number;
  outstandingBalance: number;
}

export interface UpdateTenantPlatformInput {
  name?: string;
  plan?: TenantPlanName;
  billingEmail?: string;
  subscriptionEnd?: string;
}
