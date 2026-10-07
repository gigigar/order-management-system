import { asc, eq, isNotNull, sql } from "drizzle-orm";
import Link from "next/link";
import { DueBadge } from "@/components/due-badge";
import { db } from "@/db";
import { batch, item, order, school } from "@/db/schema";
import { dueStatus, todayInManila } from "@/lib/dates";
import { dealStageLabels, productionStageLabels } from "@/lib/enums";
import { itemSummary } from "@/lib/item-summary";
import { formatPesos } from "@/lib/money";
import { requireUser } from "@/lib/session";

// Columns match the Individual orders page, plus Deal and Students.
export default async function BatchOrdersPage() {
  await requireUser();
  const today = todayInManila();
  // An item belongs to a Batch directly (Batch item) or through a School order.
  const itemBatchId = sql<number>`coalesce(${item.batchId}, ${order.batchId})`;
  const [rows, items] = await Promise.all([
    db
      .select({
        id: batch.id,
        schoolName: school.name,
        dueDate: batch.dueDate,
        dealStage: batch.dealStage,
        productionStage: batch.productionStage,
        cancelledAt: batch.cancelledAt,
        students:
          sql<number>`(select count(*) from ${order} where ${order.batchId} = ${batch.id})`.mapWith(
            Number,
          ),
      })
      .from(batch)
      .innerJoin(school, eq(batch.schoolId, school.id))
      .orderBy(sql`${batch.dueDate} asc nulls last`, school.name),
    db
      .select({
        batchId: itemBatchId,
        kind: item.kind,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        ringType: item.ringType,
        material: item.material,
        karat: item.karat,
        description: item.description,
      })
      .from(item)
      .leftJoin(order, eq(item.orderId, order.id))
      .where(isNotNull(itemBatchId))
      .orderBy(asc(item.id)),
  ]);
  const itemsByBatch = Map.groupBy(items, (i) => i.batchId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Batch orders</h1>
        <Link
          href="/batches/new"
          className="rounded bg-gray-900 px-4 py-2 text-white"
        >
          New Batch
        </Link>
      </div>
      {rows.length === 0 ? (
        <p>No Batches yet.</p>
      ) : (
        <div className="overflow-x-auto rounded border">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3">School</th>
                <th className="p-3">Product</th>
                <th className="p-3">Due date</th>
                <th className="p-3">Production</th>
                <th className="p-3">Deal</th>
                <th className="p-3 text-right">Students</th>
                <th className="p-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row) => {
                const batchItems = itemsByBatch.get(row.id) ?? [];
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
                      <Link href={`/batches/${row.id}`} className="underline">
                        {row.schoolName}
                      </Link>
                      {row.cancelledAt && (
                        <span className="ml-2 text-gray-600">(cancelled)</span>
                      )}
                    </td>
                    <td className="p-3">{itemSummary(batchItems)}</td>
                    <td className="p-3 whitespace-nowrap">
                      {row.dueDate ?? "—"}
                      <DueBadge status={status} delivered={delivered} />
                    </td>
                    <td className="p-3">
                      {productionStageLabels[row.productionStage]}
                    </td>
                    <td className="p-3">{dealStageLabels[row.dealStage]}</td>
                    <td className="p-3 text-right">{row.students}</td>
                    <td className="p-3 text-right whitespace-nowrap">
                      {formatPesos(
                        batchItems.reduce(
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
