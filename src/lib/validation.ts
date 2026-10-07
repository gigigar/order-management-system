import { z } from "zod";
import {
  BLOOD_TYPES,
  DEAL_STAGES,
  FACES,
  KARATS,
  MATERIALS,
  PRODUCTION_STAGES,
  RING_TYPES,
} from "./enums";

// Shared by the browser (React Hook Form) and the server (Server Actions), so both
// check exactly the same rules.

// Row ids sent back from the browser: null when adding, a positive integer when editing.
export const rowId = z.number().int().positive().nullable();

const name = z
  .string()
  .trim()
  .min(1, "Required")
  .max(100, "100 characters at most");

// <select> fields use valueAsNumber, so "nothing chosen" arrives as NaN.
const areaId = z
  .number({ error: "Choose an Area" })
  .int()
  .positive("Choose an Area");

export const areaSchema = z.object({ name });
export const schoolSchema = z.object({ name, areaId });
export const agentSchema = z.object({ name, areaId });
export const stoneSchema = z.object({ name });

const schoolId = z
  .number({ error: "Choose a School" })
  .int()
  .positive("Choose a School");

// Some Schools get a new Design every year; others keep one (no year).
// The year field turns an empty box into null (setValueAs in the form).
export const designSchema = z.object({
  schoolId,
  year: z
    .number({ error: "Enter a year like 2027" })
    .int("Enter a year like 2027")
    .min(1990, "Enter a year like 2027")
    .max(2100, "Enter a year like 2027")
    .nullable(),
  description: z
    .string()
    .trim()
    .min(1, "Required")
    .max(500, "500 characters at most"),
});

// Emails are stored lowercase (the invite table enforces it), so compare that way too.
export const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")),
  role: z.enum(["admin", "member"]),
});

// Optional fields arrive as null when empty (setValueAs in the form).
const optionalText = (max: number) =>
  z.string().trim().max(max, `${max} characters at most`).nullable();
const optionalId = z.number().int().positive().nullable();
const optionalDate = z.iso.date("Enter a valid date").nullable();

// Up to 2 Agents share the Commission. The first gets 100% minus the second's share.
// Shared by Batches and Individual orders.
const agentCreditFields = {
  agentId: optionalId,
  secondAgentId: optionalId,
  secondAgentShare: z
    .number({ error: "Enter a % from 1 to 99" })
    .int("Enter a % from 1 to 99")
    .min(1, "Enter a % from 1 to 99")
    .max(99, "Enter a % from 1 to 99")
    .nullable(),
};

type AgentCreditFields = {
  agentId: number | null;
  secondAgentId: number | null;
  secondAgentShare: number | null;
};

function checkAgentCredits(b: AgentCreditFields, ctx: z.RefinementCtx) {
  if (b.secondAgentId === null) return;
  if (b.agentId === null) {
    ctx.addIssue({
      code: "custom",
      path: ["agentId"],
      message: "Choose the first Agent",
    });
  } else if (b.secondAgentId === b.agentId) {
    ctx.addIssue({
      code: "custom",
      path: ["secondAgentId"],
      message: "Choose a different Agent",
    });
  }
  if (b.secondAgentShare === null) {
    ctx.addIssue({
      code: "custom",
      path: ["secondAgentShare"],
      message: "Enter a % from 1 to 99",
    });
  }
}

export const batchSchema = z
  .object({
    schoolId,
    designId: optionalId,
    repName: optionalText(100),
    repPhone: optionalText(30),
    dueDate: optionalDate,
    dealStage: z.enum(DEAL_STAGES),
    productionStage: z.enum(PRODUCTION_STAGES),
    agreementSignedOn: optionalDate,
    ...agentCreditFields,
  })
  .superRefine((b, ctx) => {
    // Same rule as the batch_signed_is_complete CHECK, so the form can say which field.
    if (b.dealStage === "agreement_signed") {
      const missing = [
        ["designId", b.designId, "Choose the Design before signing"],
        ["repName", b.repName, "Enter the Rep before signing"],
        ["dueDate", b.dueDate, "Set the Due date before signing"],
      ] as const;
      for (const [field, value, message] of missing) {
        if (!value) ctx.addIssue({ code: "custom", path: [field], message });
      }
    }
    checkAgentCredits(b, ctx);
  });

export type BatchInput = z.infer<typeof batchSchema>;

// Prices are typed in pesos (centavos allowed) and saved as centavos (src/lib/money.ts).
const pesos = (message: string) =>
  z
    .number({ error: message })
    .min(0, message)
    .max(1_000_000, "1,000,000 at most")
    // Tolerance, because 19.99 * 100 is 1998.9999999999998 in floating point.
    .refine(
      (p) => Math.abs(p * 100 - Math.round(p * 100)) < 1e-6,
      "At most 2 decimal places",
    );

const requiredText = (max: number) =>
  z
    .string({ error: "Required" })
    .trim()
    .min(1, "Required")
    .max(max, `${max} characters at most`);

const itemBase = {
  id: rowId,
  quantity: z
    .number({ error: "Enter a quantity" })
    .int("Enter a whole number")
    .min(1, "At least 1")
    .max(999, "999 at most"),
  unitPrice: pesos("Enter the price"),
};

const ringItem = z
  .object({
    ...itemBase,
    kind: z.literal("ring"),
    ringType: z.enum(RING_TYPES, { error: "Choose a Ring type" }),
    material: z.enum(MATERIALS, { error: "Choose a material" }),
    karat: z.union(KARATS.map((k) => z.literal(k))).nullable(),
    // Ring sizes go in half sizes, e.g. 7 or 7.5 (item_size_whole_or_half CHECK).
    size: z
      .number({ error: "Enter a size like 7 or 7.5" })
      .min(1, "Enter a size like 7 or 7.5")
      .max(20, "Enter a size like 7 or 7.5")
      .refine((n) => Number.isInteger(n * 2), "Use whole or half sizes"),
    // A Face is a stone from the Stones list, or the School's logo.
    face: z.enum(FACES, { error: "Choose stone or logo" }),
    stoneId: optionalId,
    engraving: optionalText(100),
  })
  .superRefine((r, ctx) => {
    // Same rule as the item_karat_only_for_gold CHECK.
    if (r.material === "gold" && r.karat === null) {
      ctx.addIssue({
        code: "custom",
        path: ["karat"],
        message: "Choose the karat",
      });
    }
    // Same rule as the item_stone_matches_face CHECK.
    if (r.face === "stone" && r.stoneId === null) {
      ctx.addIssue({
        code: "custom",
        path: ["stoneId"],
        message: "Choose the stone",
      });
    }
  });

const dogTagItem = z.object({
  ...itemBase,
  kind: z.literal("dog_tag"),
  birthday: z.iso.date("Enter the birthday"),
  bloodType: z.enum(BLOOD_TYPES, { error: "Choose a blood type" }),
});

const pinItem = z.object({ ...itemBase, kind: z.literal("pin") });

const otherItem = z.object({
  ...itemBase,
  kind: z.literal("other"),
  description: requiredText(200),
});

// Each kind only keeps its own fields: Zod drops the rest.
export const itemSchema = z.discriminatedUnion("kind", [
  ringItem,
  dogTagItem,
  pinItem,
  otherItem,
]);

export const individualOrderSchema = z
  .object({
    schoolId,
    customerName: name,
    // Required here: the public status lookup asks for its last 4 digits.
    customerPhone: z
      .string()
      .trim()
      .min(1, "Required")
      .max(30, "30 characters at most"),
    address: optionalText(300),
    dueDate: z.iso.date("Set the Due date"),
    productionStage: z.enum(PRODUCTION_STAGES),
    ...agentCreditFields,
    items: z
      .array(itemSchema)
      .min(1, "Add at least one item")
      .max(20, "20 items at most"),
  })
  .superRefine(checkAgentCredits);

// Same rule as the item_batch_item_kind CHECK.
export const batchItemSchema = z.discriminatedUnion("kind", [
  pinItem,
  otherItem,
]);

// One student's row in a Batch entry table: the row's ring, then any extra items
// (e.g. a dog tag). Payments and Agents for School orders go on the Batch.
export const schoolOrderSchema = z.object({
  id: rowId,
  customerName: name,
  // Optional: Rep lists often have no student phones (no status lookup without one).
  customerPhone: optionalText(30),
  items: z.tuple([ringItem], itemSchema),
});

// The whole Batch entry table, saved at once.
export const batchEntrySchema = z.object({
  orders: z.array(schoolOrderSchema).max(500, "500 students at most"),
  batchItems: z.array(batchItemSchema).max(20, "20 Batch items at most"),
});

export type BatchItemInput = z.infer<typeof batchItemSchema>;
export type SchoolOrderInput = z.infer<typeof schoolOrderSchema>;
export type BatchEntryInput = z.infer<typeof batchEntrySchema>;
export type ItemInput = z.infer<typeof itemSchema>;
export type IndividualOrderInput = z.infer<typeof individualOrderSchema>;

export type AreaInput = z.infer<typeof areaSchema>;
export type SchoolInput = z.infer<typeof schoolSchema>;
export type AgentInput = z.infer<typeof agentSchema>;
export type StoneInput = z.infer<typeof stoneSchema>;
export type DesignInput = z.infer<typeof designSchema>;
export type InviteInput = z.infer<typeof inviteSchema>;
