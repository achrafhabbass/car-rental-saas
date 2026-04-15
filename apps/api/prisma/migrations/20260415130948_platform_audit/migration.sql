-- CreateEnum
CREATE TYPE "PlatformAuditAction" AS ENUM ('IMPERSONATE', 'TENANT_UPDATE', 'TENANT_SUSPEND', 'TENANT_ACTIVATE', 'TENANT_CANCEL', 'TENANT_DELETE', 'TENANT_EXTEND_TRIAL', 'TENANT_EXTEND_SUBSCRIPTION', 'SWEEP_EXPIRIES');

-- CreateTable
CREATE TABLE "platform_audit_logs" (
    "id" UUID NOT NULL,
    "action" "PlatformAuditAction" NOT NULL,
    "actorUserId" UUID,
    "tenantId" UUID,
    "metadata" JSONB,
    "ipAddress" VARCHAR(64),
    "userAgent" VARCHAR(512),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "platform_audit_logs_action_idx" ON "platform_audit_logs"("action");

-- CreateIndex
CREATE INDEX "platform_audit_logs_actorUserId_idx" ON "platform_audit_logs"("actorUserId");

-- CreateIndex
CREATE INDEX "platform_audit_logs_tenantId_idx" ON "platform_audit_logs"("tenantId");

-- CreateIndex
CREATE INDEX "platform_audit_logs_createdAt_idx" ON "platform_audit_logs"("createdAt");
