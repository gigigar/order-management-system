import { integer, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";

// Column names are camelCase here and snake_case in Postgres (casing: "snake_case").

const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const area = pgTable("area", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull().unique(),
  ...timestamps,
});

// user_id (the Agent's sign-in account) is added in the auth PR, once the user table exists.
export const agent = pgTable("agent", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  areaId: integer()
    .notNull()
    .references(() => area.id, { onDelete: "restrict" }),
  ...timestamps,
});

export const school = pgTable(
  "school",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: text().notNull(),
    areaId: integer()
      .notNull()
      .references(() => area.id, { onDelete: "restrict" }),
    ...timestamps,
  },
  // Two cities can each have a "St. Mary's", but one Area can't list it twice.
  (t) => [unique("school_area_id_name_unique").on(t.areaId, t.name)],
);

export const design = pgTable("design", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  schoolId: integer()
    .notNull()
    .references(() => school.id, { onDelete: "restrict" }),
  year: integer(),
  description: text().notNull(),
  ...timestamps,
});
