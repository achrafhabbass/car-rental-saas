CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'DEMO_SCHEDULED', 'CONVERTED', 'LOST');

CREATE TABLE "demo_requests" (
  "id"            UUID NOT NULL DEFAULT gen_random_uuid(),
  "fullName"      VARCHAR(255) NOT NULL,
  "email"         VARCHAR(255) NOT NULL,
  "phone"         VARCHAR(32),
  "companyName"   VARCHAR(255),
  "preferredDate" DATE,
  "message"       VARCHAR(1000),
  "status"        "LeadStatus" NOT NULL DEFAULT 'NEW',
  "source"        VARCHAR(32) NOT NULL DEFAULT 'website',
  "notes"         VARCHAR(1000),
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "demo_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "demo_requests_status_idx" ON "demo_requests"("status");
CREATE INDEX "demo_requests_createdAt_idx" ON "demo_requests"("createdAt");
