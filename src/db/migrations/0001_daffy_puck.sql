CREATE TYPE "public"."blood_type" AS ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');--> statement-breakpoint
CREATE TYPE "public"."deal_stage" AS ENUM('meeting', 'design_presented', 'agreement_signed');--> statement-breakpoint
CREATE TYPE "public"."item_kind" AS ENUM('ring', 'dog_tag', 'pin', 'other');--> statement-breakpoint
CREATE TYPE "public"."material" AS ENUM('gold', 'silver', 'velum');--> statement-breakpoint
CREATE TYPE "public"."payment_kind" AS ENUM('deposit', 'balance');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'gcash', 'bank', 'check');--> statement-breakpoint
CREATE TYPE "public"."production_stage" AS ENUM('order_received', 'mold', 'casting', 'finishing', 'finalizing', 'ready', 'delivered');--> statement-breakpoint
CREATE TYPE "public"."ring_type" AS ENUM('megabull', 'superbull', 'bullring', 'semibull', 'mens_standard', 'unisex', 'ladies');--> statement-breakpoint
CREATE TABLE "agent_credit" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "agent_credit_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"batch_id" integer,
	"order_id" integer,
	"agent_id" integer NOT NULL,
	"share_percent" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_credit_batch_agent_unique" UNIQUE("batch_id","agent_id"),
	CONSTRAINT "agent_credit_order_agent_unique" UNIQUE("order_id","agent_id"),
	CONSTRAINT "agent_credit_one_parent" CHECK (num_nonnulls("agent_credit"."batch_id", "agent_credit"."order_id") = 1),
	CONSTRAINT "agent_credit_share_range" CHECK ("agent_credit"."share_percent" BETWEEN 1 AND 100)
);
--> statement-breakpoint
CREATE TABLE "batch" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "batch_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"school_id" integer NOT NULL,
	"design_id" integer,
	"rep_name" text,
	"rep_phone" text,
	"due_date" date,
	"deal_stage" "deal_stage" DEFAULT 'meeting' NOT NULL,
	"production_stage" "production_stage" DEFAULT 'order_received' NOT NULL,
	"agreement_signed_on" date,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "batch_signed_is_complete" CHECK ("batch"."deal_stage" <> 'agreement_signed' OR ("batch"."design_id" IS NOT NULL AND "batch"."rep_name" IS NOT NULL AND "batch"."due_date" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "item" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "item_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"order_id" integer,
	"batch_id" integer,
	"kind" "item_kind" NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" integer NOT NULL,
	"base_price" integer,
	"ring_type" "ring_type",
	"material" "material",
	"karat" smallint,
	"size" numeric(3, 1),
	"stone" text,
	"engraving" text,
	"birthday" date,
	"blood_type" "blood_type",
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "item_one_parent" CHECK (num_nonnulls("item"."order_id", "item"."batch_id") = 1),
	CONSTRAINT "item_quantity_positive" CHECK ("item"."quantity" > 0),
	CONSTRAINT "item_prices_not_negative" CHECK ("item"."unit_price" >= 0 AND ("item"."base_price" IS NULL OR "item"."base_price" >= 0)),
	CONSTRAINT "item_ring_is_complete" CHECK ("item"."kind" <> 'ring' OR ("item"."ring_type" IS NOT NULL AND "item"."material" IS NOT NULL AND "item"."size" IS NOT NULL AND "item"."stone" IS NOT NULL AND "item"."engraving" IS NOT NULL)),
	CONSTRAINT "item_karat_only_for_gold" CHECK (("item"."material" = 'gold' AND "item"."karat" IN (10, 14, 18)) OR ("item"."material" IS DISTINCT FROM 'gold' AND "item"."karat" IS NULL)),
	CONSTRAINT "item_size_whole_or_half" CHECK ("item"."size" IS NULL OR ("item"."size" > 0 AND "item"."size" * 2 = trunc("item"."size" * 2))),
	CONSTRAINT "item_dog_tag_is_complete" CHECK ("item"."kind" <> 'dog_tag' OR ("item"."birthday" IS NOT NULL AND "item"."blood_type" IS NOT NULL AND "item"."base_price" IS NOT NULL)),
	CONSTRAINT "item_other_has_description" CHECK ("item"."kind" <> 'other' OR "item"."description" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "order" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "order_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"code" text NOT NULL,
	"batch_id" integer,
	"school_id" integer NOT NULL,
	"customer_name" text NOT NULL,
	"customer_phone" text,
	"address" text,
	"due_date" date,
	"production_stage" "production_stage",
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_code_unique" UNIQUE("code"),
	CONSTRAINT "order_individual_has_due_date_and_stage" CHECK ("order"."batch_id" IS NOT NULL OR ("order"."due_date" IS NOT NULL AND "order"."production_stage" IS NOT NULL)),
	CONSTRAINT "order_school_has_no_due_date" CHECK ("order"."batch_id" IS NULL OR "order"."due_date" IS NULL)
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payment_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"batch_id" integer,
	"order_id" integer,
	"kind" "payment_kind" NOT NULL,
	"amount" integer NOT NULL,
	"method" "payment_method" NOT NULL,
	"collected_by_agent_id" integer,
	"receipt_no" text,
	"paid_on" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_one_parent" CHECK (num_nonnulls("payment"."batch_id", "payment"."order_id") = 1),
	CONSTRAINT "payment_amount_positive" CHECK ("payment"."amount" > 0)
);
--> statement-breakpoint
ALTER TABLE "agent_credit" ADD CONSTRAINT "agent_credit_batch_id_batch_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batch"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_credit" ADD CONSTRAINT "agent_credit_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_credit" ADD CONSTRAINT "agent_credit_agent_id_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agent"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch" ADD CONSTRAINT "batch_school_id_school_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."school"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch" ADD CONSTRAINT "batch_design_id_design_id_fk" FOREIGN KEY ("design_id") REFERENCES "public"."design"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item" ADD CONSTRAINT "item_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item" ADD CONSTRAINT "item_batch_id_batch_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batch"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_batch_id_batch_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batch"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_school_id_school_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."school"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_batch_id_batch_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batch"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_collected_by_agent_id_agent_id_fk" FOREIGN KEY ("collected_by_agent_id") REFERENCES "public"."agent"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "batch_open_due_date_idx" ON "batch" USING btree ("due_date") WHERE "batch"."production_stage" <> 'delivered' AND "batch"."cancelled_at" IS NULL;--> statement-breakpoint
CREATE INDEX "order_open_due_date_idx" ON "order" USING btree ("due_date") WHERE "order"."batch_id" IS NULL AND "order"."production_stage" <> 'delivered' AND "order"."cancelled_at" IS NULL;