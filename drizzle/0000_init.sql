CREATE TYPE "public"."cadence" AS ENUM('monthly', 'quarterly', 'halfyearly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."entry_source" AS ENUM('template', 'adhoc');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	CONSTRAINT "categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "payment_sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	CONSTRAINT "payment_sources_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "sheet_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"sheet_id" integer NOT NULL,
	"name" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"source" "entry_source" NOT NULL,
	"template_entry_id" integer,
	"category_id" integer,
	"payment_source" text,
	"paid" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sheets" (
	"id" serial PRIMARY KEY NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sheets_year_month_unique" UNIQUE("year","month")
);
--> statement-breakpoint
CREATE TABLE "template_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"cadence" "cadence" NOT NULL,
	"start_month" varchar(7) NOT NULL,
	"category_id" integer,
	"payment_source_id" integer
);
--> statement-breakpoint
ALTER TABLE "sheet_entries" ADD CONSTRAINT "sheet_entries_sheet_id_sheets_id_fk" FOREIGN KEY ("sheet_id") REFERENCES "public"."sheets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_entries" ADD CONSTRAINT "sheet_entries_template_entry_id_template_entries_id_fk" FOREIGN KEY ("template_entry_id") REFERENCES "public"."template_entries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_entries" ADD CONSTRAINT "sheet_entries_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_entries" ADD CONSTRAINT "template_entries_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_entries" ADD CONSTRAINT "template_entries_payment_source_id_payment_sources_id_fk" FOREIGN KEY ("payment_source_id") REFERENCES "public"."payment_sources"("id") ON DELETE set null ON UPDATE no action;