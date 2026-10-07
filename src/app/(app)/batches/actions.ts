"use server";

import { and, eq, inArray, notInArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import {
  StaleRowError,
  syncItems,
  withOrderCodeRetry,
} from "@/db/save-helpers";
import { agentCredit, batch, design, item, order } from "@/db/schema";
import { fieldErrorsOf, type ActionResult } from "@/lib/action-result";
import { creditsFrom } from "@/lib/agent-credits";
import { generateOrderCode } from "@/lib/order-code";
import { requireUser } from "@/lib/session";
import {
  batchEntrySchema,
  batchSchema,
  rowId,
  type BatchEntryInput,
  type BatchInput,
} from "@/lib/validation";

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

  const credits = creditsFrom({ agentId, secondAgentId, secondAgentShare });

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

type SaveBatchEntryResult =
  | {
      ok: true;
      // In the same order as sent, so the table can fill in new ids.
      orders: { id: number; itemIds: number[] }[];
      batchItemIds: number[];
    }
  | Extract<ActionResult, { ok: false }>;

// Saves a Batch's whole entry table (School orders and Batch items) in one transaction.
export async function saveBatchEntry(
  batchId: number,
  input: BatchEntryInput,
): Promise<SaveBatchEntryResult> {
  const user = await requireUser();
  const parsedBatchId = z.number().int().positive().parse(batchId);
  const parsed = batchEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsOf(parsed.error) };
  }
  const { orders, batchItems } = parsed.data;

  const [found] = await db
    .select({ schoolId: batch.schoolId })
    .from(batch)
    .where(eq(batch.id, parsedBatchId));
  if (!found) return { ok: false, formError: "This Batch no longer exists." };

  const save = () =>
    db.transaction(async (tx) => {
      // Students removed from the table: their items first (foreign keys), then them.
      const keptIds = orders.flatMap((o) => (o.id === null ? [] : [o.id]));
      const removed = await tx
        .select({ id: order.id })
        .from(order)
        .where(
          keptIds.length > 0
            ? and(
                eq(order.batchId, parsedBatchId),
                notInArray(order.id, keptIds),
              )
            : eq(order.batchId, parsedBatchId),
        );
      if (removed.length > 0) {
        const removedIds = removed.map((r) => r.id);
        await tx.delete(item).where(inArray(item.orderId, removedIds));
        await tx.delete(order).where(inArray(order.id, removedIds));
      }

      const saved: { id: number; itemIds: number[] }[] = [];
      for (const { id, items, ...fields } of orders) {
        let orderId: number;
        if (id === null) {
          const [created] = await tx
            .insert(order)
            .values({
              ...fields,
              batchId: parsedBatchId,
              schoolId: found.schoolId,
              code: generateOrderCode(),
              createdBy: user.id,
              updatedBy: user.id,
            })
            .returning({ id: order.id });
          orderId = created.id;
        } else {
          const [updated] = await tx
            .update(order)
            .set({ ...fields, updatedBy: user.id })
            .where(and(eq(order.id, id), eq(order.batchId, parsedBatchId)))
            .returning({ id: order.id });
          if (!updated) throw new StaleRowError();
          orderId = updated.id;
        }
        saved.push({
          id: orderId,
          itemIds: await syncItems(tx, { orderId }, items),
        });
      }

      const batchItemIds = await syncItems(
        tx,
        { batchId: parsedBatchId },
        batchItems,
      );
      await tx
        .update(batch)
        .set({ updatedBy: user.id })
        .where(eq(batch.id, parsedBatchId));
      return { orders: saved, batchItemIds };
    });

  try {
    const result = await withOrderCodeRetry(save);
    revalidatePath("/batches");
    revalidatePath("/orders");
    return { ok: true, ...result };
  } catch (error) {
    if (error instanceof StaleRowError) {
      return {
        ok: false,
        formError: "Someone else changed this Batch. Reload and try again.",
      };
    }
    throw error;
  }
}
