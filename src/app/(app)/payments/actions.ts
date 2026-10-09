"use server";

import { and, eq, type SQL } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { batch, order, payment } from "@/db/schema";
import { fieldErrorsOf, type ActionResult } from "@/lib/action-result";
import { toCentavos } from "@/lib/money";
import { requireAdmin, requireUser } from "@/lib/session";
import { paymentSchema, rowId, type PaymentInput } from "@/lib/validation";

// A Payment belongs to a Batch, or to an Individual order. Never to a School order:
// those are paid through their Batch (design doc), so the Batch total stays correct.
export type PaymentParent = { batchId: number } | { orderId: number };

const parentSchema = z.union([
  z.object({ batchId: z.number().int().positive() }),
  z.object({ orderId: z.number().int().positive() }),
]);

// Checks the parent exists and may take Payments. Returns its page path, or an error.
async function checkParent(
  parent: PaymentParent,
): Promise<{ path: string } | { error: string }> {
  if ("batchId" in parent) {
    const [found] = await db
      .select({ id: batch.id })
      .from(batch)
      .where(eq(batch.id, parent.batchId));
    return found
      ? { path: `/batches/${found.id}` }
      : { error: "This Batch no longer exists." };
  }
  const [found] = await db
    .select({ id: order.id, batchId: order.batchId })
    .from(order)
    .where(eq(order.id, parent.orderId));
  if (!found) return { error: "This Order no longer exists." };
  if (found.batchId !== null) {
    return { error: "School orders are paid through their Batch." };
  }
  return { path: `/orders/${found.id}` };
}

// Matches only Payments of this parent, so an id from another Batch can't be edited here.
function belongsTo(parent: PaymentParent): SQL {
  return "batchId" in parent
    ? eq(payment.batchId, parent.batchId)
    : eq(payment.orderId, parent.orderId);
}

// Adds a Payment (id null) or edits one. Anyone signed in can do both (decision 4).
export async function savePayment(
  parent: PaymentParent,
  id: number | null,
  input: PaymentInput,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsedParent = parentSchema.parse(parent);
  const parsedId = rowId.parse(id);
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsOf(parsed.error) };
  }

  const checked = await checkParent(parsedParent);
  if ("error" in checked) return { ok: false, formError: checked.error };

  const values = { ...parsed.data, amount: toCentavos(parsed.data.amount) };
  if (parsedId === null) {
    await db.insert(payment).values({
      ...values,
      ...parsedParent,
      createdBy: user.id,
      updatedBy: user.id,
    });
  } else {
    const [updated] = await db
      .update(payment)
      .set({ ...values, updatedBy: user.id })
      .where(and(eq(payment.id, parsedId), belongsTo(parsedParent)))
      .returning({ id: payment.id });
    if (!updated) {
      return { ok: false, formError: "This Payment no longer exists." };
    }
  }
  revalidatePath(checked.path);
  return { ok: true };
}

// Owners only (decision 4): Amount owed (Oct 31) is computed from these rows,
// so money records shouldn't disappear quietly.
export async function deletePayment(
  parent: PaymentParent,
  id: number,
): Promise<ActionResult> {
  await requireAdmin();
  const parsedParent = parentSchema.parse(parent);
  const parsedId = z.number().int().positive().parse(id);
  const checked = await checkParent(parsedParent);
  if ("error" in checked) return { ok: false, formError: checked.error };

  const [deleted] = await db
    .delete(payment)
    .where(and(eq(payment.id, parsedId), belongsTo(parsedParent)))
    .returning({ id: payment.id });
  if (!deleted) {
    return { ok: false, formError: "This Payment no longer exists." };
  }
  revalidatePath(checked.path);
  return { ok: true };
}
