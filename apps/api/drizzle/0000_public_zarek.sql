CREATE SCHEMA IF NOT EXISTS "reparte";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reparte"."scan_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scan_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"quantidade" text NOT NULL,
	"unidade" text NOT NULL,
	"valor_unitario" text NOT NULL,
	"valor_total" text NOT NULL,
	"owner" text DEFAULT 'shared' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reparte"."scans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"emitente" text NOT NULL,
	"cnpj" text NOT NULL,
	"total" text NOT NULL,
	"data_emissao" text NOT NULL,
	"qr_code_url" text NOT NULL,
	"scanned_by" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "reparte"."scan_items" ADD CONSTRAINT "scan_items_scan_id_scans_id_fk" FOREIGN KEY ("scan_id") REFERENCES "reparte"."scans"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;