export type TenantStatusName = 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'EXPIRED' | 'CANCELLED';
export type TenantPlanName = 'STARTER' | 'BUSINESS' | 'ENTERPRISE';

export interface TenantDto {
  id: string;
  name: string;
  slug: string;
  subdomain: string | null;
  status: TenantStatusName;
  plan: TenantPlanName;
  locale: string;
  currency: string;
  subscriptionEnd: string | null;
  trialEndsAt: string | null;
  createdAt: string;
}
