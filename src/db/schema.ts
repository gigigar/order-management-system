import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

import {
  BLOOD_TYPES,
  DEAL_STAGES,
  FACES,
  ITEM_KINDS,
  MATERIALS,
  PRODUCTION_STAGES,
  RING_TYPES,
} from "../lib/enums";
import { user } from "./auth-schema";

export * from "./auth-schema";

// Column names are camelCase here and snake_case in Postgres (casing: "snake_case").

const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

// Who created and last changed a Batch, Order or Payment. Users are never deleted while referenced.
const audit = {
  createdBy: text()
    .notNull()
    .references(() => user.id, { onDelete: "restrict" }),
  updatedBy: text()
    .notNull()
    .references(() => user.id, { onDelete: "restrict" }),
};

export const userRole = pgEnum("user_role", ["admin", "member"]);

// Only invited emails can sign in (plus OWNER_EMAILS). Stored lowercase.
export const invite = pgTable(
  "invite",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    email: text().notNull().unique(),
    role: userRole().notNull().default("member"),
    ...timestamps,
  },
  (t) => [check("invite_email_lowercase", sql`${t.email} = lower(${t.email})`)],
);

export const area = pgTable("area", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull().unique(),
  ...timestamps,
});

export const agent = pgTable("agent", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  // The Agent's sign-in account, once they have one.
  userId: text()
    .unique("agent_user_id_unique")
    .references(() => user.id, { onDelete: "restrict" }),
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

// Stones offered for rings, managed in Setup (the list changes with the supplier).
export const stone = pgTable("stone", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull().unique(),
  ...timestamps,
});

export const design = pgTable("design", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  schoolId: integer()
    .notNull()
    .references(() => school.id, { onDelete: "restrict" }),
  year: integer(),
  description: text().notNull(),
  ...timestamps,
});

// Stages follow CONTEXT.md (values in src/lib/enums.ts). Order matters: Postgres
// compares enum values by position.
export const dealStage = pgEnum("deal_stage", DEAL_STAGES);

export const productionStage = pgEnum("production_stage", PRODUCTION_STAGES);

export const itemKind = pgEnum("item_kind", ITEM_KINDS);

export const ringType = pgEnum("ring_type", RING_TYPES);

export const material = pgEnum("material", MATERIALS);

export const face = pgEnum("face", FACES);

export const bloodType = pgEnum("blood_type", BLOOD_TYPES);

export const paymentKind = pgEnum("payment_kind", ["deposit", "balance"]);

export const paymentMethod = pgEnum("payment_method", [
  "cash",
  "gcash",
  "bank",
  "check",
]);

// Money is integer centavos.

export const batch = pgTable(
  "batch",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    schoolId: integer()
      .notNull()
      .references(() => school.id, { onDelete: "restrict" }),
    designId: integer().references(() => design.id, { onDelete: "restrict" }),
    repName: text(),
    repPhone: text(),
    dueDate: date(),
    dealStage: dealStage().notNull().default("meeting"),
    productionStage: productionStage().notNull().default("order_received"),
    agreementSignedOn: date(),
    cancelledAt: timestamp({ withTimezone: true }),
    ...timestamps,
    ...audit,
  },
  (t) => [
    // A Batch can be saved half-filled during the deal, but not once it's signed.
    check(
      "batch_signed_is_complete",
      sql`${t.dealStage} <> 'agreement_signed' OR (${t.designId} IS NOT NULL AND ${t.repName} IS NOT NULL AND ${t.dueDate} IS NOT NULL)`,
    ),
    // The dashboard's overdue / due-soon query only looks at open work.
    index("batch_open_due_date_idx")
      .on(t.dueDate)
      .where(
        sql`${t.productionStage} <> 'delivered' AND ${t.cancelledAt} IS NULL`,
      ),
  ],
);

export const order = pgTable(
  "order",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    // Public lookup code: random, not the primary key, encodes nothing.
    code: text().notNull().unique(),
    // Null = Individual order.
    batchId: integer().references(() => batch.id, { onDelete: "restrict" }),
    schoolId: integer()
      .notNull()
      .references(() => school.id, { onDelete: "restrict" }),
    customerName: text().notNull(),
    customerPhone: text(),
    address: text(),
    dueDate: date(),
    // Individual order: its own Stage. School order: null follows the Batch; set = held back.
    productionStage: productionStage(),
    cancelledAt: timestamp({ withTimezone: true }),
    ...timestamps,
    ...audit,
  },
  (t) => [
    check(
      "order_individual_has_due_date_and_stage",
      sql`${t.batchId} IS NOT NULL OR (${t.dueDate} IS NOT NULL AND ${t.productionStage} IS NOT NULL)`,
    ),
    check(
      "order_school_has_no_due_date",
      sql`${t.batchId} IS NULL OR ${t.dueDate} IS NULL`,
    ),
    index("order_open_due_date_idx")
      .on(t.dueDate)
      .where(
        sql`${t.batchId} IS NULL AND ${t.productionStage} <> 'delivered' AND ${t.cancelledAt} IS NULL`,
      ),
  ],
);

export const item = pgTable(
  "item",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    // Exactly one: an Order's item, or a Batch item (e.g. pins for the whole Batch).
    orderId: integer().references(() => order.id, { onDelete: "restrict" }),
    batchId: integer().references(() => batch.id, { onDelete: "restrict" }),
    kind: itemKind().notNull(),
    quantity: integer().notNull().default(1),
    // Copied when saved, so later price changes don't rewrite old Orders.
    unitPrice: integer().notNull(),
    // Ring
    ringType: ringType(),
    material: material(),
    karat: smallint(),
    size: numeric({ precision: 3, scale: 1, mode: "number" }),
    face: face(),
    stoneId: integer().references(() => stone.id, { onDelete: "restrict" }),
    engraving: text(),
    // Dog tag
    birthday: date(),
    bloodType: bloodType(),
    // Other
    description: text(),
    ...timestamps,
  },
  (t) => [
    check("item_one_parent", sql`num_nonnulls(${t.orderId}, ${t.batchId}) = 1`),
    check("item_quantity_positive", sql`${t.quantity} > 0`),
    check("item_price_not_negative", sql`${t.unitPrice} >= 0`),
    // Engraving is optional: not every ring is engraved.
    check(
      "item_ring_is_complete",
      sql`${t.kind} <> 'ring' OR (${t.ringType} IS NOT NULL AND ${t.material} IS NOT NULL AND ${t.size} IS NOT NULL AND ${t.face} IS NOT NULL)`,
    ),
    // Karat only for gold, and always for gold.
    check(
      "item_karat_only_for_gold",
      sql`(${t.material} = 'gold' AND ${t.karat} IN (10, 14, 18)) OR (${t.material} IS DISTINCT FROM 'gold' AND ${t.karat} IS NULL)`,
    ),
    // A stone exactly when the Face is a stone; a logo has none.
    check(
      "item_stone_matches_face",
      sql`(${t.face} IS NOT DISTINCT FROM 'stone') = (${t.stoneId} IS NOT NULL)`,
    ),
    check(
      "item_size_whole_or_half",
      sql`${t.size} IS NULL OR (${t.size} > 0 AND ${t.size} * 2 = trunc(${t.size} * 2))`,
    ),
    check(
      "item_dog_tag_is_complete",
      sql`${t.kind} <> 'dog_tag' OR (${t.birthday} IS NOT NULL AND ${t.bloodType} IS NOT NULL)`,
    ),
    check(
      "item_other_has_description",
      sql`${t.kind} <> 'other' OR ${t.description} IS NOT NULL`,
    ),
  ],
);

// Which Agent(s) get Commission on a Batch or Individual order. "At most 2, shares add up
// to 100" spans rows, so the Server Action enforces it.
export const agentCredit = pgTable(
  "agent_credit",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    batchId: integer().references(() => batch.id, { onDelete: "restrict" }),
    orderId: integer().references(() => order.id, { onDelete: "restrict" }),
    agentId: integer()
      .notNull()
      .references(() => agent.id, { onDelete: "restrict" }),
    sharePercent: smallint().notNull(),
    ...timestamps,
  },
  (t) => [
    check(
      "agent_credit_one_parent",
      sql`num_nonnulls(${t.batchId}, ${t.orderId}) = 1`,
    ),
    check("agent_credit_share_range", sql`${t.sharePercent} BETWEEN 1 AND 100`),
    unique("agent_credit_batch_agent_unique").on(t.batchId, t.agentId),
    unique("agent_credit_order_agent_unique").on(t.orderId, t.agentId),
  ],
);

export const payment = pgTable(
  "payment",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    batchId: integer().references(() => batch.id, { onDelete: "restrict" }),
    orderId: integer().references(() => order.id, { onDelete: "restrict" }),
    kind: paymentKind().notNull(),
    amount: integer().notNull(),
    method: paymentMethod().notNull(),
    // Null = paid straight to the Main office.
    collectedByAgentId: integer().references(() => agent.id, {
      onDelete: "restrict",
    }),
    receiptNo: text(),
    paidOn: date().notNull(),
    ...timestamps,
    ...audit,
  },
  (t) => [
    check(
      "payment_one_parent",
      sql`num_nonnulls(${t.batchId}, ${t.orderId}) = 1`,
    ),
    check("payment_amount_positive", sql`${t.amount} > 0`),
  ],
);
