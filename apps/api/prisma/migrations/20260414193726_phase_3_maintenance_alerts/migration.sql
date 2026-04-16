-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('OIL_CHANGE', 'REVISION', 'TIRE_CHANGE', 'BRAKES', 'BATTERY', 'INSPECTION', 'REPAIR', 'OTHER');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('INSURANCE_EXPIRY', 'TECHNICAL_VISIT_EXPIRY', 'VIGNETTE_EXPIRY', 'MAINTENANCE_DUE', 'MAINTENANCE_OVERDUE', 'CREDIT_PAYMENT_DUE', 'INVOICE_OVERDUE');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('UNREAD', 'READ', 'ARCHIVED');

-- CreateTable
CREATE TABLE "maintenance_records" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "type" "MaintenanceType" NOT NULL,
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'COMPLETED',
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "km" INTEGER,
    "cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "garage" VARCHAR(255),
    "reference" VARCHAR(128),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_schedules" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "type" "MaintenanceType" NOT NULL,
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'SCHEDULED',
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "dueDate" DATE,
    "dueKm" INTEGER,
    "isCritical" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "completedRecordId" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL DEFAULT 'WARNING',
    "status" "AlertStatus" NOT NULL DEFAULT 'OPEN',
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "vehicleId" UUID,
    "contractId" UUID,
    "invoiceId" UUID,
    "creditId" UUID,
    "scheduleId" UUID,
    "dueAt" TIMESTAMP(3),
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "userId" UUID,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "status" "NotificationStatus" NOT NULL DEFAULT 'UNREAD',
    "title" VARCHAR(255) NOT NULL,
    "body" TEXT NOT NULL,
    "link" VARCHAR(512),
    "alertId" UUID,
    "metadata" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "maintenance_records_tenantId_idx" ON "maintenance_records"("tenantId");

-- CreateIndex
CREATE INDEX "maintenance_records_tenantId_vehicleId_idx" ON "maintenance_records"("tenantId", "vehicleId");

-- CreateIndex
CREATE INDEX "maintenance_records_performedAt_idx" ON "maintenance_records"("performedAt");

-- CreateIndex
CREATE INDEX "maintenance_records_type_idx" ON "maintenance_records"("type");

-- CreateIndex
CREATE INDEX "maintenance_schedules_tenantId_idx" ON "maintenance_schedules"("tenantId");

-- CreateIndex
CREATE INDEX "maintenance_schedules_tenantId_vehicleId_status_idx" ON "maintenance_schedules"("tenantId", "vehicleId", "status");

-- CreateIndex
CREATE INDEX "maintenance_schedules_dueDate_idx" ON "maintenance_schedules"("dueDate");

-- CreateIndex
CREATE INDEX "maintenance_schedules_isCritical_idx" ON "maintenance_schedules"("isCritical");

-- CreateIndex
CREATE INDEX "alerts_tenantId_idx" ON "alerts"("tenantId");

-- CreateIndex
CREATE INDEX "alerts_tenantId_status_idx" ON "alerts"("tenantId", "status");

-- CreateIndex
CREATE INDEX "alerts_tenantId_severity_idx" ON "alerts"("tenantId", "severity");

-- CreateIndex
CREATE INDEX "alerts_type_idx" ON "alerts"("type");

-- CreateIndex
CREATE INDEX "alerts_dueAt_idx" ON "alerts"("dueAt");

-- CreateIndex
CREATE INDEX "notifications_tenantId_idx" ON "notifications"("tenantId");

-- CreateIndex
CREATE INDEX "notifications_tenantId_userId_status_idx" ON "notifications"("tenantId", "userId", "status");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
