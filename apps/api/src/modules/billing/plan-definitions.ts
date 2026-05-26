import { TenantPlan } from '@prisma/client';

export interface PlanDefinition {
  key: TenantPlan;
  name: string;
  description: string;
  priceMonthly: number;
  priceAnnual: number;
  currency: string;
  maxVehicles: number | null; // null = unlimited
  maxUsers: number | null;
  features: string[];
  /**
   * Plans marked `public: false` are kept for backward-compat (existing
   * tenants on the legacy tier still resolve via getPlan) but are NOT
   * offered for new signups or shown on pricing pages.
   */
  public: boolean;
}

// Annual prices align with the PRD (3000 MAD Basic / 5000 MAD Pro).
// Monthly prices are set ~20% above prorated annual to incentivize annual
// commitments — standard SaaS practice.
export const PLANS: Record<TenantPlan, PlanDefinition> = {
  STARTER: {
    key: 'STARTER',
    name: 'Basic',
    description: 'Idéal pour les petites agences',
    priceMonthly: 300,
    priceAnnual: 3000,
    currency: 'MAD',
    maxVehicles: 10,
    maxUsers: 3,
    features: [
      'Gestion flotte (max 10 véhicules)',
      'Réservations & contrats',
      'Facturation de base',
      'Alertes maintenance',
      '3 utilisateurs max',
    ],
    public: true,
  },
  BUSINESS: {
    key: 'BUSINESS',
    name: 'Pro',
    description: 'Pour les agences en croissance',
    priceMonthly: 500,
    priceAnnual: 5000,
    currency: 'MAD',
    maxVehicles: 50,
    maxUsers: 10,
    features: [
      'Gestion flotte (max 50 véhicules)',
      'Réservations & contrats',
      'Facturation avancée',
      'Alertes & rapports',
      'Inspections véhicules',
      'Export PDF & Excel',
      '10 utilisateurs max',
    ],
    public: true,
  },
  // Legacy plan — kept for any grandfathered tenants in the DB. Not listed
  // publicly. The Prisma TenantPlan enum still has this value, so removing
  // it from PLANS would break getPlan() for those tenants.
  ENTERPRISE: {
    key: 'ENTERPRISE',
    name: 'Enterprise (legacy)',
    description: 'Plan historique — non commercialisé',
    priceMonthly: 2499,
    priceAnnual: 24990,
    currency: 'MAD',
    maxVehicles: null,
    maxUsers: null,
    features: [
      'Véhicules illimités',
      'Utilisateurs illimités',
      'Toutes les fonctionnalités',
    ],
    public: false,
  },
};

export function getPlan(key: TenantPlan): PlanDefinition {
  return PLANS[key];
}

/** Plans offered to new customers (filters out legacy/internal plans). */
export function getPublicPlans(): PlanDefinition[] {
  return Object.values(PLANS).filter((p) => p.public);
}
