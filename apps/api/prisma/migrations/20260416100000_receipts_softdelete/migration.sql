-- Subscription receipts
CREATE TABLE "subscription_receipts" (
  "id"            UUID NOT NULL DEFAULT gen_random_uuid(),
  "receiptNumber" VARCHAR(32) NOT NULL,
  "paymentId"     UUID NOT NULL,
  "tenantId"      UUID NOT NULL,
  "amount"        DECIMAL(12, 2) NOT NULL,
  "currency"      VARCHAR(8) NOT NULL DEFAULT 'MAD',
  "method"        VARCHAR(32) NOT NULL,
  "reference"     VARCHAR(255),
  "issuedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "subscription_receipts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "subscription_receipts_receiptNumber_key" UNIQUE ("receiptNumber"),
  CONSTRAINT "subscription_receipts_paymentId_key" UNIQUE ("paymentId"),
  CONSTRAINT "subscription_receipts_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "subscription_payments"("id") ON DELETE RESTRICT,
  CONSTRAINT "subscription_receipts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT
);

CREATE INDEX "subscription_receipts_tenantId_idx" ON "subscription_receipts"("tenantId");

-- Soft delete on rental_contracts and invoices
ALTER TABLE "rental_contracts" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "invoices" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Audit log extensions
ALTER TYPE "PlatformAuditAction" ADD VALUE 'ENTITY_SOFT_DELETE';
ALTER TYPE "PlatformAuditAction" ADD VALUE 'ENTITY_RESTORE';
