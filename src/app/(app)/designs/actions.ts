"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { design } from "@/db/schema";
import { fieldErrorsOf, type ActionResult } from "@/lib/action-result";
import { requireUser } from "@/lib/session";
import { designSchema, rowId, type DesignInput } from "@/lib/validation";

// Same pattern as saveArea: re-check the session and the input on the server.
export async function saveDesign(
  id: number | null,
  input: DesignInput,
): Promise<ActionResult> {
  await requireUser();
  const parsedId = rowId.parse(id);
  const parsed = designSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsOf(parsed.error) };
  }

  if (parsedId === null) {
    await db.insert(design).values(parsed.data);
  } else {
    await db.update(design).set(parsed.data).where(eq(design.id, parsedId));
  }

  revalidatePath("/designs");
  return { ok: true };
}
