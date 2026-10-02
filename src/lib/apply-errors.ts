import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import type { ActionResult } from "@/lib/action-result";

// Shows a Server Action's errors in the form, under the same fields as browser errors.
export function applyErrors<T extends FieldValues>(
  result: Extract<ActionResult, { ok: false }>,
  setError: UseFormSetError<T>,
) {
  for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
    setError(field as Path<T>, { message });
  }
  if (result.formError) setError("root", { message: result.formError });
}
