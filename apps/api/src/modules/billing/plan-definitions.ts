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
}

export const PLANS: Record<TenantPlan, PlanDefinition> = {
  STARTER: {
    key: 'STARTER',
    name: 'Basic',
    description: 'Idéal pour les petites agences',
    priceMonthly: 499,
    priceAnnual: 4990,
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
  },
  BUSINESS: {
    key: 'BUSINESS',
    name: 'Standard',
    description: 'Pour les agences en croissance',
    priceMonthly: 999,
    priceAnnual: 9990,
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
  },
  ENTERPRISE: {
    key: 'ENTERPRISE',
    name: 'Premium',
    description: 'Pour les grandes agences multi-sites',
    priceMonthly: 2499,
    priceAnnual: 24990,
    currency: 'MAD',
    maxVehicles: null,
    maxUsers: null,
    features: [
      'Véhicules illimités',
      'Utilisateurs illimités',
      'Toutes les fonctionnalités',
      'Rapports avancés',
      'API & intégrations',
      'Support prioritaire',
      'Multi-agences',
    ],
  },
};

export function getPlan(key: TenantPlan): PlanDefinition {
  return PLANS[key];
}
