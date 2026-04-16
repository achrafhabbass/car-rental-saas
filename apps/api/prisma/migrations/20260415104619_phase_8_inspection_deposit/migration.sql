-- CreateEnum
CREATE TYPE "InspectionType" AS ENUM ('DEPARTURE', 'RETURN');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('DRAFT', 'COMPLETED');

-- CreateEnum
CREATE TYPE "FuelLevel" AS ENUM ('EMPTY', 'QUARTER', 'HALF', 'THREE_QUARTERS', 'FULL');

-- CreateEnum
CREATE TYPE "VehicleConditionRating" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'POOR');

-- CreateEnum
CREATE TYPE "DepositStatus" AS ENUM ('HELD', 'REFUNDED', 'PARTIAL_REFUND', 'CONSUMED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ContractStatus" ADD VALUE 'RETURNED';
ALTER TYPE "ContractStatus" ADD VALUE 'OVERDUE';

-- CreateTable
CREATE TABLE "vehicle_inspections" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "contractId" UUID NOT NULL,
    "type" "InspectionType" NOT NULL,
    "status" "InspectionStatus" NOT NULL DEFAULT 'COMPLETED',
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "km" INTEGER NOT NULL,
    "fuelLevel" "FuelLevel" NOT NULL DEFAULT 'FULL',
    "condition" "VehicleConditionRating" NOT NULL DEFAULT 'GOOD',
    "damages" TEXT,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "agentName" VARCHAR(255),
    "signatureUrl" VARCHAR(512),
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposits" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "depositNumber" VARCHAR(32) NOT NULL,
    "contractId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" "DepositMethod" NOT NULL,
    "reference" VARCHAR(128),
    "refundedAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "consumedAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "DepositStatus" NOT NULL DEFAULT 'HELD',
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settledAt" TIMESTAMP(3),
    "settledByUserId" UUID,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deposits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vehicle_inspections_tenantId_idx" ON "vehicle_inspections"("tenantId");

-- CreateIndex
CREATE INDEX "vehicle_inspections_tenantId_vehicleId_idx" ON "vehicle_inspections"("tenantId", "vehicleId");

-- CreateIndex
CREATE INDEX "vehicle_inspections_performedAt_idx" ON "vehicle_inspections"("performedAt");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_inspections_contractId_type_key" ON "vehicle_inspections"("contractId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "deposits_contractId_key" ON "deposits"("contractId");

-- CreateIndex
CREATE INDEX "deposits_tenantId_idx" ON "deposits"("tenantId");

-- CreateIndex
CREATE INDEX "deposits_tenantId_status_idx" ON "deposits"("tenantId", "status");

-- CreateIndex
CREATE INDEX "deposits_clientId_idx" ON "deposits"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "deposits_tenantId_depositNumber_key" ON "deposits"("tenantId", "depositNumber");

-- AddForeignKey
ALTER TABLE "vehicle_inspections" ADD CONSTRAINT "vehicle_inspections_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_inspections" ADD CONSTRAINT "vehicle_inspections_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_inspections" ADD CONSTRAINT "vehicle_inspections_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "rental_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "rental_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
