-- Subscription billing: payment history for SaaS tenant subscriptions
CREATE TYPE "SubscriptionPeriod" AS ENUM ('MONTHLY', 'ANNUAL');

CREATE TABLE "subscription_payments" (
  "id"        UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenantId"  UUID NOT NULL,
  "plan"      "TenantPlan" NOT NULL,
  "period"    "SubscriptionPeriod" NOT NULL,
  "amount"    DECIMAL(12, 2) NOT NULL,
  "currency"  VARCHAR(8) NOT NULL DEFAULT 'MAD',
  "method"    VARCHAR(32) NOT NULL,
  "reference" VARCHAR(255),
  "startDate" DATE NOT NULL,
  "endDate"   DATE NOT NULL,
  "notes"     VARCHAR(500),
  "paidAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "subscription_payments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "subscription_payments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT
);

CREATE INDEX "subscription_payments_tenantId_idx" ON "subscription_payments"("tenantId");
CREATE INDEX "subscription_payments_paidAt_idx" ON "subscription_payments"("paidAt");
