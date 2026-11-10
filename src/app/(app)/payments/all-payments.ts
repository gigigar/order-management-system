import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { agent, batch, order, payment, school } from "@/db/schema";

// Every Payment, oldest first, for the Payments page and the Excel file. Filtering happens
// in applyView. Payments on cancelled entries stay in: the money was still received.
export async function loadAllPayments() {
  return db
    .select({
      id: payment.id,
      paidOn: payment.paidOn,
      receiptNo: payment.receiptNo,
      amount: payment.amount,
      method: payment.method,
      schoolName: school.name,
      customerName: order.customerName,
      collectedBy: agent.name,
      batchCancelledAt: batch.cancelledAt,
      orderCancelledAt: order.cancelledAt,
    })
    .from(payment)
    .leftJoin(batch, eq(payment.batchId, batch.id))
    .leftJoin(school, eq(batch.schoolId, school.id))
    .leftJoin(order, eq(payment.orderId, order.id))
    .leftJoin(agent, eq(payment.collectedByAgentId, agent.id))
    .orderBy(asc(payment.paidOn), asc(payment.id));
}
