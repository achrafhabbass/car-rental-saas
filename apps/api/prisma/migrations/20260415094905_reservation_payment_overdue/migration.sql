-- CreateEnum
CREATE TYPE "ReservationPaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'REFUNDED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ReservationStatus" ADD VALUE 'OVERDUE';
ALTER TYPE "ReservationStatus" ADD VALUE 'COMPLETED';

-- AlterTable
ALTER TABLE "reservations" ADD COLUMN     "overdueSince" TIMESTAMP(3),
ADD COLUMN     "paymentStatus" "ReservationPaymentStatus" NOT NULL DEFAULT 'PENDING';
