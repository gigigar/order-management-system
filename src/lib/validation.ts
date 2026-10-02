import { z } from "zod";

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

export type AreaInput = z.infer<typeof areaSchema>;
export type SchoolInput = z.infer<typeof schoolSchema>;
export type AgentInput = z.infer<typeof agentSchema>;
export type DesignInput = z.infer<typeof designSchema>;
export type InviteInput = z.infer<typeof inviteSchema>;

// Row ids sent back from the browser: null when adding, a positive integer when editing.
export const rowId = z.number().int().positive().nullable();
