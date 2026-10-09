import "server-only";
import { and, asc, eq, isNull, lte, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { batch, order, school } from "@/db/schema";
import { addDays } from "@/lib/dates";

// Overdue and due-soon work: signed Batches and Individual orders, not Delivered,
// not cancelled, due on or before `today + 7`. Both queries match the partial
// indexes' WHERE (production_stage <> 'delivered' AND cancelled_at IS NULL), so
// Postgres reads only open work, in due-date order.
export async function loadDueWork(today: string) {
  const cutoff = addDays(today, 7);

  // Totals and Payments per row, as subqueries. Money is centavos.
  const batchOwed = sql<number>`(
    select coalesce(sum(i.quantity * i.unit_price), 0) from item i
    where i.batch_id = ${batch.id}
       or i.order_id in (select o.id from "order" o
                         where o.batch_id = ${batch.id} and o.cancelled_at is null)
  )::int`;
  const batchPaid = sql<number>`(
    select coalesce(sum(p.amount), 0) from payment p where p.batch_id = ${batch.id}
  )::int`;
  const orderOwed = sql<number>`(
    select coalesce(sum(i.quantity * i.unit_price), 0) from item i
    where i.order_id = ${order.id}
  )::int`;
  const orderPaid = sql<number>`(
    select coalesce(sum(p.amount), 0) from payment p where p.order_id = ${order.id}
  )::int`;

  const [batches, orders] = await Promise.all([
    db
      .select({
        id: batch.id,
        name: school.name,
        dueDate: batch.dueDate,
        stage: batch.productionStage,
        owed: batchOwed,
        paid: batchPaid,
      })
      .from(batch)
      .innerJoin(school, eq(batch.schoolId, school.id))
      .where(
        and(
          ne(batch.productionStage, "delivered"),
          isNull(batch.cancelledAt),
          // Still in the deal = no deadline yet; those stay on the Batches page.
          eq(batch.dealStage, "agreement_signed"),
          lte(batch.dueDate, cutoff),
        ),
      )
      .orderBy(asc(batch.dueDate)),
    db
      .select({
        id: order.id,
        name: order.customerName,
        dueDate: order.dueDate,
        stage: order.productionStage,
        owed: orderOwed,
        paid: orderPaid,
      })
      .from(order)
      .where(
        and(
          isNull(order.batchId),
          ne(order.productionStage, "delivered"),
          isNull(order.cancelledAt),
          lte(order.dueDate, cutoff),
        ),
      )
      .orderBy(asc(order.dueDate)),
  ]);
  return { batches, orders };
}
