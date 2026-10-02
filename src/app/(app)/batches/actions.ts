"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { agentCredit, batch, design } from "@/db/schema";
import { fieldErrorsOf, type ActionResult } from "@/lib/action-result";
import { requireUser } from "@/lib/session";
import { batchSchema, rowId, type BatchInput } from "@/lib/validation";

type SaveBatchResult =
  { ok: true; id: number } | Extract<ActionResult, { ok: false }>;

export async function saveBatch(
  id: number | null,
  input: BatchInput,
): Promise<SaveBatchResult> {
  const user = await requireUser();
  const parsedId = rowId.parse(id);
  const parsed = batchSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsOf(parsed.error) };
  }
  const { agentId, secondAgentId, secondAgentShare, ...fields } = parsed.data;

  // A rule across tables, so it lives here, not in a CHECK (design doc).
  if (fields.designId !== null) {
    const [match] = await db
      .select({ id: design.id })
      .from(design)
      .where(
        and(
          eq(design.id, fields.designId),
          eq(design.schoolId, fields.schoolId),
        ),
      );
    if (!match) {
      return {
        ok: false,
        fieldErrors: { designId: "That Design belongs to another School." },
      };
    }
  }

  const credits =
    agentId === null
      ? []
      : secondAgentId === null
        ? [{ agentId, sharePercent: 100 }]
        : [
            { agentId, sharePercent: 100 - secondAgentShare! },
            { agentId: secondAgentId, sharePercent: secondAgentShare! },
          ];

  // One transaction: the Batch and its Agent credits save together or not at all.
  const savedId = await db.transaction(async (tx) => {
    let batchId: number;
    if (parsedId === null) {
      const [created] = await tx
        .insert(batch)
        .values({ ...fields, createdBy: user.id, updatedBy: user.id })
        .returning({ id: batch.id });
      batchId = created.id;
    } else {
      const [updated] = await tx
        .update(batch)
        .set({ ...fields, updatedBy: user.id })
        .where(eq(batch.id, parsedId))
        .returning({ id: batch.id });
      if (!updated) return null;
      batchId = updated.id;
      await tx.delete(agentCredit).where(eq(agentCredit.batchId, batchId));
    }
    if (credits.length > 0) {
      await tx
        .insert(agentCredit)
        .values(credits.map((c) => ({ ...c, batchId })));
    }
    return batchId;
  });

  if (savedId === null) {
    return { ok: false, formError: "This Batch no longer exists." };
  }
  revalidatePath("/batches");
  return { ok: true, id: savedId };
}
