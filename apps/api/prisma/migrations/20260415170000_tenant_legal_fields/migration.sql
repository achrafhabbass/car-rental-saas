-- Moroccan legal identifiers + additional company info for printed documents
ALTER TABLE "tenants"
  ADD COLUMN "city"      VARCHAR(120),
  ADD COLUMN "website"   VARCHAR(255),
  ADD COLUMN "taxId"     VARCHAR(64),
  ADD COLUMN "ice"       VARCHAR(32),
  ADD COLUMN "rc"        VARCHAR(64),
  ADD COLUMN "patente"   VARCHAR(64),
  ADD COLUMN "cnss"      VARCHAR(64),
  ADD COLUMN "bankName"  VARCHAR(120),
  ADD COLUMN "bankRib"   VARCHAR(64);
