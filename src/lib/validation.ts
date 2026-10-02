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

export type AreaInput = z.infer<typeof areaSchema>;
export type SchoolInput = z.infer<typeof schoolSchema>;
export type AgentInput = z.infer<typeof agentSchema>;

// Row ids sent back from the browser: null when adding, a positive integer when editing.
export const rowId = z.number().int().positive().nullable();
