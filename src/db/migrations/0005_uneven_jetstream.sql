CREATE TYPE "public"."face" AS ENUM('stone', 'logo');--> statement-breakpoint
CREATE TABLE "stone" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "stone_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stone_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "item" DROP CONSTRAINT "item_ring_is_complete";--> statement-breakpoint
ALTER TABLE "item" ADD COLUMN "face" "face";--> statement-breakpoint
ALTER TABLE "item" ADD COLUMN "stone_id" integer;--> statement-breakpoint
ALTER TABLE "item" ADD CONSTRAINT "item_stone_id_stone_id_fk" FOREIGN KEY ("stone_id") REFERENCES "public"."stone"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
-- Hand-written backfill (before the new CHECKs): stones typed as text become
-- Stones-list entries, and those rings get Face = stone.
INSERT INTO "stone" ("name") SELECT DISTINCT trim("stone") FROM "item" WHERE "kind" = 'ring' AND trim("stone") <> '' ON CONFLICT ("name") DO NOTHING;--> statement-breakpoint
UPDATE "item" SET "face" = 'stone', "stone_id" = "stone"."id" FROM "stone" WHERE "item"."kind" = 'ring' AND trim("item"."stone") = "stone"."name";--> statement-breakpoint
UPDATE "item" SET "face" = 'logo' WHERE "kind" = 'ring' AND "face" IS NULL;--> statement-breakpoint
ALTER TABLE "item" ADD CONSTRAINT "item_stone_matches_face" CHECK (("item"."face" IS NOT DISTINCT FROM 'stone') = ("item"."stone_id" IS NOT NULL));--> statement-breakpoint
ALTER TABLE "item" ADD CONSTRAINT "item_ring_is_complete" CHECK ("item"."kind" <> 'ring' OR ("item"."ring_type" IS NOT NULL AND "item"."material" IS NOT NULL AND "item"."size" IS NOT NULL AND "item"."face" IS NOT NULL));