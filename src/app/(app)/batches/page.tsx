import { eq, sql } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { batch, order, school } from "@/db/schema";
import { dueStatus, todayInManila } from "@/lib/dates";
import { dealStageLabels, productionStageLabels } from "@/lib/enums";
import { requireUser } from "@/lib/session";

const dueLabels = { overdue: "Overdue", due_soon: "Due soon" } as const;

export default async function BatchesPage() {
  await requireUser();
  const today = todayInManila();
  const rows = await db
    .select({
      id: batch.id,
      schoolName: school.name,
      dueDate: batch.dueDate,
      dealStage: batch.dealStage,
      productionStage: batch.productionStage,
      cancelledAt: batch.cancelledAt,
      orders:
        sql<number>`(select count(*) from ${order} where ${order.batchId} = ${batch.id})`.mapWith(
          Number,
        ),
    })
    .from(batch)
    .innerJoin(school, eq(batch.schoolId, school.id))
    .orderBy(sql`${batch.dueDate} asc nulls last`, school.name);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Batches</h1>
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
                <th className="p-3">Due date</th>
                <th className="p-3">Production</th>
                <th className="p-3">Deal</th>
                <th className="p-3 text-right">Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row) => {
                const status = dueStatus(row.dueDate, today, {
                  delivered: row.productionStage === "delivered",
                  cancelled: row.cancelledAt !== null,
                });
                return (
                  <tr key={row.id}>
                    <td className="p-3">
                      <Link href={`/batches/${row.id}`} className="underline">
                        {row.schoolName}
                      </Link>
                      {row.cancelledAt && (
                        <span className="ml-2 text-gray-600">(cancelled)</span>
                      )}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {row.dueDate ?? "—"}
                      {status && (
                        <span
                          className={`ml-2 rounded px-1.5 py-0.5 text-xs ${
                            status === "overdue"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-900"
                          }`}
                        >
                          {dueLabels[status]}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {productionStageLabels[row.productionStage]}
                    </td>
                    <td className="p-3">{dealStageLabels[row.dealStage]}</td>
                    <td className="p-3 text-right">{row.orders}</td>
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
