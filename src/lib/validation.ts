import { z } from "zod";
import { DEAL_STAGES, PRODUCTION_STAGES } from "./enums";

// Shared by the browser (React Hook Form) and the server (Server Actions), so both
// check exactly the same rules.

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
    // Up to 2 Agents share the Commission. The first gets 100% minus the second's share.
    agentId: optionalId,
    secondAgentId: optionalId,
    secondAgentShare: z
      .number({ error: "Enter a % from 1 to 99" })
      .int("Enter a % from 1 to 99")
      .min(1, "Enter a % from 1 to 99")
      .max(99, "Enter a % from 1 to 99")
      .nullable(),
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
    if (b.secondAgentId !== null) {
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
  });

export type BatchInput = z.infer<typeof batchSchema>;

export type AreaInput = z.infer<typeof areaSchema>;
export type SchoolInput = z.infer<typeof schoolSchema>;
export type AgentInput = z.infer<typeof agentSchema>;
export type DesignInput = z.infer<typeof designSchema>;
export type InviteInput = z.infer<typeof inviteSchema>;

// Row ids sent back from the browser: null when adding, a positive integer when editing.
export const rowId = z.number().int().positive().nullable();
