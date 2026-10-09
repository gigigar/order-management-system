import { asc, eq, inArray, or } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { agentCredit, batch, item, order, school } from "@/db/schema";
import { itemInputFromRow } from "@/lib/items";
import type { BatchItemInput, SchoolOrderInput } from "@/lib/validation";
import { requireUser } from "@/lib/session";
import { loadPayments } from "../../payments/load";
import { PaymentsSection } from "../../payments/payments-section";
import { BatchEntry } from "../batch-entry";
import { BatchForm } from "../batch-form";
import { batchFormOptions } from "../options";

// The entry table shows a student's ring in its columns, so it goes first.
function ringFirst(
  rows: (typeof item.$inferSelect)[],
): SchoolOrderInput["items"] {
  const ring = rows.find((r) => r.kind === "ring");
  const rest = rows.filter((r) => r !== ring);
  return [ring, ...rest]
    .filter((r) => r !== undefined)
    .map(itemInputFromRow) as SchoolOrderInput["items"];
}

export default async function BatchPage({
  params,
}: PageProps<"/batches/[id]">) {
  const user = await requireUser();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [[found], credits, options, orders, items, payments] =
    await Promise.all([
      db
        .select({ batch, schoolName: school.name })
        .from(batch)
        .innerJoin(school, eq(batch.schoolId, school.id))
        .where(eq(batch.id, id)),
      db
        .select()
        .from(agentCredit)
        .where(eq(agentCredit.batchId, id))
        .orderBy(agentCredit.id),
      batchFormOptions(),
      db
        .select()
        .from(order)
        .where(eq(order.batchId, id))
        .orderBy(asc(order.id)),
      // The Batch's own items and its School orders' items, in one query.
      db
        .select()
        .from(item)
        .where(
          or(
            eq(item.batchId, id),
            inArray(
              item.orderId,
              db
                .select({ id: order.id })
                .from(order)
                .where(eq(order.batchId, id)),
            ),
          ),
        )
        .orderBy(asc(item.id)),
      loadPayments({ batchId: id }),
    ]);
  const batchItems = items.filter((i) => i.batchId === id);
  const itemsByOrder = Map.groupBy(
    items.filter((i) => i.orderId !== null),
    (i) => i.orderId!,
  );
  if (!found) notFound();
  const b = found.batch;
  const [first, second] = credits;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Batch · {found.schoolName}</h1>
      <BatchForm
        id={b.id}
        options={options}
        defaultValues={{
          schoolId: b.schoolId,
          designId: b.designId,
          repName: b.repName,
          repPhone: b.repPhone,
          dueDate: b.dueDate,
          dealStage: b.dealStage,
          productionStage: b.productionStage,
          agreementSignedOn: b.agreementSignedOn,
          agentId: first?.agentId ?? null,
          secondAgentId: second?.agentId ?? null,
          secondAgentShare: second?.sharePercent ?? null,
        }}
      />
      <div className="border-t pt-4">
        <BatchEntry
          batchId={b.id}
          stones={options.stones}
          defaultValues={{
            orders: orders.map((o) => ({
              id: o.id,
              customerName: o.customerName,
              customerPhone: o.customerPhone,
              items: ringFirst(itemsByOrder.get(o.id) ?? []),
            })),
            // The item_batch_item_kind CHECK keeps these to pins and other items.
            batchItems: batchItems.map(itemInputFromRow) as BatchItemInput[],
          }}
        />
      </div>
      <div className="border-t pt-4">
        <PaymentsSection
          parent={{ batchId: b.id }}
          loaded={payments}
          agents={options.agents}
          isAdmin={user.role === "admin"}
        />
      </div>
    </div>
  );
}
