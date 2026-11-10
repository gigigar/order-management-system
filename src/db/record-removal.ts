import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { db } from "./index";
import { agentCredit, batch, item, order, payment } from "./schema";

// Deletes entries made by mistake. Anything with a Payment stays on record and can only
// be cancelled. Each returns false, deleting nothing, when the entry can't be deleted.

export async function deleteUnpaidBatch(id: number): Promise<boolean> {
  return db.transaction(async (tx) => {
    const orders = await tx
      .select({ id: order.id })
      .from(order)
      .where(eq(order.batchId, id));
    const orderIds = orders.map((o) => o.id);

    const [paid] = await tx
      .select({ id: payment.id })
      .from(payment)
      .where(or(eq(payment.batchId, id), inArray(payment.orderId, orderIds)))
      .limit(1);
    if (paid) return false;

    await tx
      .delete(item)
      .where(or(eq(item.batchId, id), inArray(item.orderId, orderIds)));
    await tx
      .delete(agentCredit)
      .where(
        or(eq(agentCredit.batchId, id), inArray(agentCredit.orderId, orderIds)),
      );
    await tx.delete(order).where(eq(order.batchId, id));
    const deleted = await tx
      .delete(batch)
      .where(eq(batch.id, id))
      .returning({ id: batch.id });
    return deleted.length === 1;
  });
}

// Individual orders only: a School order is removed from its Batch's entry table.
export async function deleteUnpaidOrder(id: number): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [individual] = await tx
      .select({ id: order.id })
      .from(order)
      .where(and(eq(order.id, id), isNull(order.batchId)));
    if (!individual) return false;

    const [paid] = await tx
      .select({ id: payment.id })
      .from(payment)
      .where(eq(payment.orderId, id))
      .limit(1);
    if (paid) return false;

    await tx.delete(item).where(eq(item.orderId, id));
    await tx.delete(agentCredit).where(eq(agentCredit.orderId, id));
    await tx.delete(order).where(eq(order.id, id));
    return true;
  });
}
