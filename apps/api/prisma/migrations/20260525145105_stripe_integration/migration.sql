-- Stripe integration: link tenants to a Stripe customer/subscription,
-- and dedup webhook events for safe retries.

ALTER TABLE "tenants"
  ADD COLUMN "stripeCustomerId" VARCHAR(64),
  ADD COLUMN "stripeSubscriptionId" VARCHAR(64);

CREATE UNIQUE INDEX "tenants_stripeCustomerId_key" ON "tenants"("stripeCustomerId");
CREATE UNIQUE INDEX "tenants_stripeSubscriptionId_key" ON "tenants"("stripeSubscriptionId");

CREATE TABLE "stripe_events" (
  "id" VARCHAR(64) NOT NULL,
  "type" VARCHAR(64) NOT NULL,
  "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "stripe_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "stripe_events_type_idx" ON "stripe_events"("type");
CREATE INDEX "stripe_events_processedAt_idx" ON "stripe_events"("processedAt");
