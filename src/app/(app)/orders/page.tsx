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
      <PageHeader
        title="Individual orders"
        description="Orders from single Customers, soonest Due date first."
        action={{ href: "/orders/new", label: "New Individual order" }}
      />
      {rows.length === 0 ? (
        <p>No Individual orders yet.</p>
      ) : (
        <Card className="py-0">
          <Table className="tabular-nums">
            <TableHeader>
              <TableRow className="text-xs tracking-wider text-muted-foreground uppercase">
                <TableHead className="px-4">Customer</TableHead>
                <TableHead className="px-4">School</TableHead>
                <TableHead className="px-4">Product</TableHead>
                <TableHead className="px-4">Due date</TableHead>
                <TableHead className="px-4">Production</TableHead>
                <TableHead className="px-4">Code</TableHead>
                <TableHead className="px-4 text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const orderItems = itemsByOrder.get(row.id) ?? [];
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
                        href={`/orders/${row.id}`}
                        className="hover:text-[#8a6420] hover:underline"
                      >
                        {row.customerName}
                      </Link>
                      {row.cancelledAt && (
                        <span className="ml-2 text-muted-foreground">
                          (cancelled)
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
                      {row.schoolName}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 whitespace-normal text-[#4a3b30]">
                      {itemSummary(orderItems)}
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
                      {row.dueDate ?? "—"}
                      <DueBadge status={status} delivered={delivered} />
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
                      {row.productionStage &&
                        productionStageLabels[row.productionStage]}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 font-mono">
                      {row.code}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-right">
                      {formatPesos(
                        orderItems.reduce(
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
