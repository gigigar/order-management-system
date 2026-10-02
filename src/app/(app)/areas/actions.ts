"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { area } from "@/db/schema";
import {
  fieldErrorsOf,
  isUniqueViolation,
  type ActionResult,
} from "@/lib/action-result";
import { requireUser } from "@/lib/session";
import { areaSchema, rowId, type AreaInput } from "@/lib/validation";

// Adds an Area (id null) or renames one. The browser already validated, but anyone
// can call a Server Action directly, so every check runs again here.
export async function saveArea(
  id: number | null,
  input: AreaInput,
): Promise<ActionResult> {
  await requireUser();
  const parsedId = rowId.parse(id);
  const parsed = areaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsOf(parsed.error) };
  }

  try {
    if (parsedId === null) {
      await db.insert(area).values(parsed.data);
    } else {
      await db.update(area).set(parsed.data).where(eq(area.id, parsedId));
    }
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        fieldErrors: { name: "An Area with this name already exists." },
      };
    }
    throw error;
  }

  revalidatePath("/areas");
  return { ok: true };
}
