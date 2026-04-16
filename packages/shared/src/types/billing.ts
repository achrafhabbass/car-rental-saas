export type SubscriptionPeriodName = 'MONTHLY' | 'ANNUAL';

export interface PlanDefinitionDto {
  key: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceAnnual: number;
  currency: string;
  maxVehicles: number | null;
  maxUsers: number | null;
  features: string[];
}

export interface SubscriptionPaymentDto {
  id: string;
  tenantId: string;
  plan: string;
  period: SubscriptionPeriodName;
  amount: string;
  currency: string;
  method: string;
  reference: string | null;
  startDate: string;
  endDate: string;
  notes: string | null;
  paidAt: string;
  tenant?: { name: string; slug: string };
}

export interface BillingSummaryDto {
  totalRevenue: number;
  revenueThisMonth: number;
  paymentCount: number;
  avgPayment: number;
}

export interface RecordSubscriptionPaymentInput {
  plan: string;
  period: SubscriptionPeriodName;
  amount: number;
  method: string;
  reference?: string;
  startDate?: string;
  notes?: string;
}
