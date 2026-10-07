"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { stone } from "@/db/schema";
import {
  fieldErrorsOf,
  isUniqueViolation,
  type ActionResult,
} from "@/lib/action-result";
import { requireUser } from "@/lib/session";
import { stoneSchema, rowId, type StoneInput } from "@/lib/validation";

// Adds a Stone (id null) or renames one. The browser already validated, but anyone
// can call a Server Action directly, so every check runs again here.
export async function saveStone(
  id: number | null,
  input: StoneInput,
): Promise<ActionResult> {
  await requireUser();
  const parsedId = rowId.parse(id);
  const parsed = stoneSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsOf(parsed.error) };
  }

  try {
    if (parsedId === null) {
      await db.insert(stone).values(parsed.data);
    } else {
      await db.update(stone).set(parsed.data).where(eq(stone.id, parsedId));
    }
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        fieldErrors: { name: "An Stone with this name already exists." },
      };
    }
    throw error;
  }

  revalidatePath("/stones");
  return { ok: true };
}
