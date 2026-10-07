import { asc, desc, eq, isNotNull, sql } from "drizzle-orm";
import Link from "next/link";
import { DueBadge } from "@/components/due-badge";
import { db } from "@/db";
import { batch, item, order, school } from "@/db/schema";
import { dueStatus, todayInManila } from "@/lib/dates";
import { productionStageLabels } from "@/lib/enums";
import { itemSummary } from "@/lib/item-summary";
import { formatPesos } from "@/lib/money";
import { requireUser } from "@/lib/session";

export default async function OrdersPage() {
  await requireUser();
  const today = todayInManila();
  // A School order's Due date is its Batch's; its Stage is its own only when held back.
  const dueDate = sql<
    string | null
  >`coalesce(${order.dueDate}, ${batch.dueDate})`;
  const rows = await db
    .select({
      id: order.id,
      code: order.code,
      customerName: order.customerName,
      schoolName: school.name,
      batchId: order.batchId,
      dueDate,
      productionStage: sql<
        keyof typeof productionStageLabels
      >`coalesce(${order.productionStage}, ${batch.productionStage})`,
      cancelled: sql<boolean>`(${order.cancelledAt} is not null or ${batch.cancelledAt} is not null)`,
    })
    .from(order)
    .innerJoin(school, eq(order.schoolId, school.id))
    .leftJoin(batch, eq(order.batchId, batch.id))
    .orderBy(sql`${dueDate} asc nulls last`, desc(order.id));
  // Every Order's items in one query, grouped here for the Product and Total columns.
  const items = await db
    .select({
      orderId: item.orderId,
      kind: item.kind,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      ringType: item.ringType,
      material: item.material,
      karat: item.karat,
      description: item.description,
    })
    .from(item)
    .where(isNotNull(item.orderId))
    .orderBy(asc(item.id));
  const itemsByOrder = Map.groupBy(items, (i) => i.orderId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Orders</h1>
        <Link
          href="/orders/new"
          className="rounded bg-gray-900 px-4 py-2 text-white"
        >
          New Individual order
        </Link>
      </div>
      {rows.length === 0 ? (
        <p>No Orders yet.</p>
      ) : (
        <div className="overflow-x-auto rounded border">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3">Customer</th>
                <th className="p-3">Code</th>
                <th className="p-3">Product</th>
                <th className="p-3">School</th>
                <th className="p-3">Due date</th>
                <th className="p-3">Production</th>
                <th className="p-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row) => {
                const orderItems = itemsByOrder.get(row.id) ?? [];
                const total = orderItems.reduce(
                  (sum, i) => sum + i.quantity * i.unitPrice,
                  0,
                );
                const delivered = row.productionStage === "delivered";
                const status = dueStatus(row.dueDate, today, {
                  delivered,
                  cancelled: row.cancelled,
                });
                return (
                  <tr
                    key={row.id}
                    className={delivered ? "text-gray-500" : undefined}
                  >
                    <td className="p-3">
                      <Link href={`/orders/${row.id}`} className="underline">
                        {row.customerName}
                      </Link>
                      {row.cancelled && (
                        <span className="ml-2 text-gray-600">(cancelled)</span>
                      )}
                    </td>
                    <td className="p-3 font-mono">{row.code}</td>
                    <td className="p-3">{itemSummary(orderItems)}</td>
                    <td className="p-3">
                      {row.schoolName}
                      <span className="ml-2 text-gray-600">
                        {row.batchId === null ? "Individual" : "School"}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {row.dueDate ?? "—"}
                      <DueBadge status={status} delivered={delivered} />
                    </td>
                    <td className="p-3">
                      {productionStageLabels[row.productionStage]}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      {formatPesos(total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
