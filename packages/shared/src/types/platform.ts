import type { TenantPlanName, TenantStatusName } from './tenant';

export interface PlatformMetricsDto {
  tenants: {
    total: number;
    active: number;
    trial: number;
    suspended: number;
    cancelled: number;
    newThisMonth: number;
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
  phone: string | null;
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
  subscriptionStart: string | null;
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
  phone?: string;
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
  subscriptionEnd?: string;
}

export interface ExtendSubscriptionInput {
  days?: number;
  newEndDate?: string;
}
