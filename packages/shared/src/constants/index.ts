export const APP_NAME = 'AutoSphere';
export const APP_TAGLINE = 'Car Rental Management SaaS';

export const DEFAULT_LOCALE = 'fr';
export const SUPPORTED_LOCALES = ['fr', 'ar', 'en'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_CURRENCY = 'MAD';
export const DEFAULT_TIMEZONE = 'Africa/Casablanca';

export const TENANT_HEADER = 'x-tenant-id';

export const TRIAL_DAYS = 14;

export const USER_ROLES = [
  'SUPER_ADMIN',
  'OWNER',
  'MANAGER',
  'AGENT',
  'ACCOUNTANT',
  'VIEWER',
] as const;

export const TENANT_PLANS = {
  STARTER: { maxVehicles: 10, maxUsers: 3, annualPriceMad: 2400 },
  BUSINESS: { maxVehicles: 30, maxUsers: 10, annualPriceMad: 3600 },
  ENTERPRISE: { maxVehicles: Infinity, maxUsers: Infinity, annualPriceMad: null },
} as const;
