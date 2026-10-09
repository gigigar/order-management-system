import "server-only";
import { and, asc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { agent, item, order, payment } from "@/db/schema";
import type { PaymentParent } from "./actions";

// What the Payments section needs: the amount due and the Payments so far.
export async function loadPayments(parent: PaymentParent) {
  // A Batch owes its own items plus its School orders' items (cancelled students don't count).
  const itemsOwed =
    "batchId" in parent
      ? or(
          eq(item.batchId, parent.batchId),
          inArray(
            item.orderId,
            db
              .select({ id: order.id })
              .from(order)
              .where(
                and(
                  eq(order.batchId, parent.batchId),
                  isNull(order.cancelledAt),
                ),
              ),
          ),
        )
      : eq(item.orderId, parent.orderId);

  const [[owed], payments] = await Promise.all([
    db
      .select({
        total: sql<number>`coalesce(sum(${item.quantity} * ${item.unitPrice}), 0)::int`,
      })
      .from(item)
      .where(itemsOwed),
    db
      .select({ payment, agentName: agent.name })
      .from(payment)
      .leftJoin(agent, eq(payment.collectedByAgentId, agent.id))
      .where(
        "batchId" in parent
          ? eq(payment.batchId, parent.batchId)
          : eq(payment.orderId, parent.orderId),
      )
      .orderBy(asc(payment.paidOn), asc(payment.id)),
  ]);
  return { totalCentavos: owed.total, payments };
}

export type LoadedPayments = Awaited<ReturnType<typeof loadPayments>>;
