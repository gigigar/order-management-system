CREATE TABLE "agent" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "agent_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"area_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "area" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "area_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "area_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "design" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "design_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"school_id" integer NOT NULL,
	"year" integer,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "school" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "school_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"area_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "school_area_id_name_unique" UNIQUE("area_id","name")
);
--> statement-breakpoint
ALTER TABLE "agent" ADD CONSTRAINT "agent_area_id_area_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."area"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design" ADD CONSTRAINT "design_school_id_school_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."school"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school" ADD CONSTRAINT "school_area_id_area_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."area"("id") ON DELETE restrict ON UPDATE no action;