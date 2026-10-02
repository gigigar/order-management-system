"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { school } from "@/db/schema";
import {
  fieldErrorsOf,
  isUniqueViolation,
  type ActionResult,
} from "@/lib/action-result";
import { requireUser } from "@/lib/session";
import { schoolSchema, rowId, type SchoolInput } from "@/lib/validation";

// Same pattern as saveArea: re-check the session and the input on the server.
export async function saveSchool(
  id: number | null,
  input: SchoolInput,
): Promise<ActionResult> {
  await requireUser();
  const parsedId = rowId.parse(id);
  const parsed = schoolSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsOf(parsed.error) };
  }

  try {
    if (parsedId === null) {
      await db.insert(school).values(parsed.data);
    } else {
      await db.update(school).set(parsed.data).where(eq(school.id, parsedId));
    }
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        fieldErrors: { name: "This Area already has a School with this name." },
      };
    }
    throw error;
  }

  revalidatePath("/schools");
  return { ok: true };
}
