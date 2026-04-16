-- Email audit log for tracking all sent/failed emails
CREATE TABLE "email_logs" (
  "id"        UUID NOT NULL DEFAULT gen_random_uuid(),
  "to"        VARCHAR(255) NOT NULL,
  "subject"   VARCHAR(500) NOT NULL,
  "status"    VARCHAR(16) NOT NULL DEFAULT 'SUCCESS',
  "error"     VARCHAR(1000),
  "category"  VARCHAR(32) NOT NULL,
  "tenantId"  UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "email_logs_createdAt_idx" ON "email_logs"("createdAt");
CREATE INDEX "email_logs_tenantId_idx" ON "email_logs"("tenantId");
CREATE INDEX "email_logs_status_idx" ON "email_logs"("status");
