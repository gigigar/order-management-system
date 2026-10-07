import { asc, desc, eq, isNull, sql } from "drizzle-orm";
import Link from "next/link";
import { DueBadge } from "@/components/due-badge";
import { db } from "@/db";
import { item, order, school } from "@/db/schema";
import { dueStatus, todayInManila } from "@/lib/dates";
import { productionStageLabels } from "@/lib/enums";
import { itemSummary } from "@/lib/item-summary";
import { formatPesos } from "@/lib/money";
import { requireUser } from "@/lib/session";

// Individual orders only; School orders are listed and edited in their Batch.
// Columns match the Batch orders page.
export default async function IndividualOrdersPage() {
  await requireUser();
  const today = todayInManila();
  const [rows, items] = await Promise.all([
    db
      .select({
        id: order.id,
        code: order.code,
        customerName: order.customerName,
        schoolName: school.name,
        dueDate: order.dueDate,
        productionStage: order.productionStage,
        cancelledAt: order.cancelledAt,
      })
      .from(order)
      .innerJoin(school, eq(order.schoolId, school.id))
      .where(isNull(order.batchId))
      .orderBy(sql`${order.dueDate} asc nulls last`, desc(order.id)),
    // Every Individual order's items in one query, for the Product and Total columns.
    db
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
      .innerJoin(order, eq(item.orderId, order.id))
      .where(isNull(order.batchId))
      .orderBy(asc(item.id)),
  ]);
  const itemsByOrder = Map.groupBy(items, (i) => i.orderId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Individual orders</h1>
        <Link
          href="/orders/new"
          className="rounded bg-gray-900 px-4 py-2 text-white"
        >
          New Individual order
        </Link>
      </div>
      {rows.length === 0 ? (
        <p>No Individual orders yet.</p>
      ) : (
        <div className="overflow-x-auto rounded border">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3">Customer</th>
                <th className="p-3">School</th>
                <th className="p-3">Product</th>
                <th className="p-3">Due date</th>
                <th className="p-3">Production</th>
                <th className="p-3">Code</th>
                <th className="p-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row) => {
                const orderItems = itemsByOrder.get(row.id) ?? [];
                const delivered = row.productionStage === "delivered";
                const status = dueStatus(row.dueDate, today, {
                  delivered,
                  cancelled: row.cancelledAt !== null,
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
                      {row.cancelledAt && (
                        <span className="ml-2 text-gray-600">(cancelled)</span>
                      )}
                    </td>
                    <td className="p-3">{row.schoolName}</td>
                    <td className="p-3">{itemSummary(orderItems)}</td>
                    <td className="p-3 whitespace-nowrap">
                      {row.dueDate ?? "—"}
                      <DueBadge status={status} delivered={delivered} />
                    </td>
                    <td className="p-3">
                      {row.productionStage &&
                        productionStageLabels[row.productionStage]}
                    </td>
                    <td className="p-3 font-mono">{row.code}</td>
                    <td className="p-3 text-right whitespace-nowrap">
                      {formatPesos(
                        orderItems.reduce(
                          (sum, i) => sum + i.quantity * i.unitPrice,
                          0,
                        ),
                      )}
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
