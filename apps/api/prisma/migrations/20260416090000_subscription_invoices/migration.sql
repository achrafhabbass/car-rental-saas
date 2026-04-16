-- Subscription invoices linked to subscription payments
CREATE TABLE "subscription_invoices" (
  "id"            UUID NOT NULL DEFAULT gen_random_uuid(),
  "invoiceNumber" VARCHAR(32) NOT NULL,
  "paymentId"     UUID NOT NULL,
  "tenantId"      UUID NOT NULL,
  "amount"        DECIMAL(12, 2) NOT NULL,
  "taxRate"       DECIMAL(5, 4) NOT NULL DEFAULT 0.2000,
  "taxAmount"     DECIMAL(12, 2) NOT NULL,
  "totalTtc"      DECIMAL(12, 2) NOT NULL,
  "currency"      VARCHAR(8) NOT NULL DEFAULT 'MAD',
  "issuedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "subscription_invoices_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "subscription_invoices_invoiceNumber_key" UNIQUE ("invoiceNumber"),
  CONSTRAINT "subscription_invoices_paymentId_key" UNIQUE ("paymentId"),
  CONSTRAINT "subscription_invoices_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "subscription_payments"("id") ON DELETE RESTRICT,
  CONSTRAINT "subscription_invoices_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT
);

CREATE INDEX "subscription_invoices_tenantId_idx" ON "subscription_invoices"("tenantId");
CREATE INDEX "subscription_invoices_issuedAt_idx" ON "subscription_invoices"("issuedAt");
