import { asc, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { agentCredit, item, order } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { itemInputFromRow } from "@/lib/items";
import { batchFormOptions } from "../../batches/options";
import { OrderForm } from "../order-form";

export default async function OrderPage({ params }: PageProps<"/orders/[id]">) {
  await requireUser();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [[found], items, credits, options] = await Promise.all([
    db.select().from(order).where(eq(order.id, id)),
    db.select().from(item).where(eq(item.orderId, id)).orderBy(asc(item.id)),
    db
      .select()
      .from(agentCredit)
      .where(eq(agentCredit.orderId, id))
      .orderBy(asc(agentCredit.id)),
    batchFormOptions(),
  ]);
  if (!found) notFound();
  // School orders are entered and edited in their Batch.
  if (found.batchId !== null) redirect(`/batches/${found.batchId}`);
  const [first, second] = credits;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">{found.customerName}</h1>
        <p className="text-sm text-gray-600">
          Individual order · code{" "}
          <span className="font-mono text-gray-900">{found.code}</span>
        </p>
      </div>
      <OrderForm
        id={found.id}
        options={options}
        defaultValues={{
          schoolId: found.schoolId,
          customerName: found.customerName,
          customerPhone: found.customerPhone ?? "",
          address: found.address,
          dueDate: found.dueDate!,
          productionStage: found.productionStage!,
          agentId: first?.agentId ?? null,
          secondAgentId: second?.agentId ?? null,
          secondAgentShare: second?.sharePercent ?? null,
          items: items.map(itemInputFromRow),
        }}
      />
    </div>
  );
}
