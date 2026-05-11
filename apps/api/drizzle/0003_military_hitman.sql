ALTER TABLE "reparte"."scans" ALTER COLUMN "cnpj" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "reparte"."scans" ALTER COLUMN "qr_code_url" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "reparte"."scans" ADD COLUMN IF NOT EXISTS "kind" text DEFAULT 'nfce' NOT NULL;
