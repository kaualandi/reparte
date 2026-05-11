ALTER TABLE "reparte"."scans" ADD COLUMN IF NOT EXISTS "paid_by" text;
--> statement-breakpoint
UPDATE "reparte"."scans" SET "paid_by" = "scanned_by" WHERE "paid_by" IS NULL;
--> statement-breakpoint
ALTER TABLE "reparte"."scans" ALTER COLUMN "paid_by" SET NOT NULL;
