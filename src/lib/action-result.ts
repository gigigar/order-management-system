import type { z } from "zod";

// What every Server Action returns to its form.
export type ActionResult =
  | { ok: true }
  | { ok: false; fieldErrors?: Record<string, string>; formError?: string };

// First Zod message per field, e.g. { name: "Required" }.
export function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "");
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return errors;
}

// Postgres error 23505: a UNIQUE constraint refused the row. Drizzle wraps the
// driver's error, so the code may be on the error itself or on its cause.
export function isUniqueViolation(error: unknown): boolean {
  const candidates = [error, error instanceof Error ? error.cause : undefined];
  return candidates.some(
    (e) =>
      typeof e === "object" && e !== null && "code" in e && e.code === "23505",
  );
}
