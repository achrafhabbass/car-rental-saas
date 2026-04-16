-- Add logo storage for tenant branding (base64 data URL)
ALTER TABLE "tenants" ADD COLUMN "logoUrl" TEXT;
