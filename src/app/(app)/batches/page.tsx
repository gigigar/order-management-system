import { asc, eq, isNotNull, sql } from "drizzle-orm";
import Link from "next/link";
import { DueBadge } from "@/components/due-badge";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
      <PageHeader
        title="Batch orders"
        description="Every School's Batch, soonest Due date first."
        action={{ href: "/batches/new", label: "New Batch" }}
      />
      {rows.length === 0 ? (
        <p>No Batches yet.</p>
      ) : (
        <Card className="py-0">
          <Table className="tabular-nums">
            <TableHeader>
              <TableRow className="text-xs tracking-wider text-muted-foreground uppercase">
                <TableHead className="px-4">School</TableHead>
                <TableHead className="px-4">Product</TableHead>
                <TableHead className="px-4">Due date</TableHead>
                <TableHead className="px-4">Production</TableHead>
                <TableHead className="px-4">Deal</TableHead>
                <TableHead className="px-4 text-right">Students</TableHead>
                <TableHead className="px-4 text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const batchItems = itemsByBatch.get(row.id) ?? [];
                const delivered = row.productionStage === "delivered";
                const status = dueStatus(row.dueDate, today, {
                  delivered,
                  cancelled: row.cancelledAt !== null,
                });
                return (
                  <TableRow
                    key={row.id}
                    className={delivered ? "text-muted-foreground" : undefined}
                  >
                    <TableCell className="px-4 py-3.5 font-medium">
                      <Link
                        href={`/batches/${row.id}`}
                        className="hover:text-[#8a6420] hover:underline"
                      >
                        {row.schoolName}
                      </Link>
                      {row.cancelledAt && (
                        <span className="ml-2 text-muted-foreground">
                          (cancelled)
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 whitespace-normal text-[#4a3b30]">
                      {itemSummary(batchItems)}
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
                      {row.dueDate ?? "—"}
                      <DueBadge status={status} delivered={delivered} />
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
                      {productionStageLabels[row.productionStage]}
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
                      {dealStageLabels[row.dealStage]}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-right">
                      {row.students}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-right">
                      {formatPesos(
                        batchItems.reduce(
                          (sum, i) => sum + i.quantity * i.unitPrice,
                          0,
                        ),
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
