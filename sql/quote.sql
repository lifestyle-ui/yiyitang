ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "code" text,
  ADD COLUMN IF NOT EXISTS "pillCount" integer,
  ADD COLUMN IF NOT EXISTS "vendor" text;

CREATE TABLE IF NOT EXISTS "Quote" (
  id text PRIMARY KEY,
  "orderNo" text,
  "orderDate" date,
  "orderType" text DEFAULT '一般訂單',
  "clientId" text,
  "clientName" text,
  items text,
  shipping integer DEFAULT 0,
  "exchangeRate" numeric DEFAULT 1,
  notes text,
  total integer DEFAULT 0,
  "prescriptionId" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);
