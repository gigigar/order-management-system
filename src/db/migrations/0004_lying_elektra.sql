ALTER TABLE "item" DROP CONSTRAINT "item_prices_not_negative";--> statement-breakpoint
ALTER TABLE "item" DROP CONSTRAINT "item_dog_tag_is_complete";--> statement-breakpoint
ALTER TABLE "item" DROP COLUMN "base_price";--> statement-breakpoint
ALTER TABLE "item" ADD CONSTRAINT "item_price_not_negative" CHECK ("item"."unit_price" >= 0);--> statement-breakpoint
ALTER TABLE "item" ADD CONSTRAINT "item_dog_tag_is_complete" CHECK ("item"."kind" <> 'dog_tag' OR ("item"."birthday" IS NOT NULL AND "item"."blood_type" IS NOT NULL));