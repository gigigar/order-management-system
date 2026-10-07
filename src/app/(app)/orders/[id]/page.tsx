import { asc, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { agentCredit, item, order } from "@/db/schema";
import type { KARATS } from "@/lib/enums";
import { toPesos } from "@/lib/money";
import { requireUser } from "@/lib/session";
import type { ItemInput } from "@/lib/validation";
import { batchFormOptions } from "../../batches/options";
import { OrderForm } from "../order-form";

type Karat = (typeof KARATS)[number];

// Database row → form row: centavos back to pesos, and only the kind's own fields.
// The item_*_is_complete CHECKs guarantee each kind's fields are filled, hence the !s.
function toItemInput(row: typeof item.$inferSelect): ItemInput {
  const base = {
    id: row.id,
    quantity: row.quantity,
    unitPrice: toPesos(row.unitPrice),
  };
  switch (row.kind) {
    case "ring":
      return {
        ...base,
        kind: "ring",
        ringType: row.ringType!,
        material: row.material!,
        // The item_karat_only_for_gold CHECK keeps it to 10, 14 or 18.
        karat: row.karat as Karat | null,
        size: row.size!,
        face: row.face!,
        stoneId: row.stoneId,
        engraving: row.engraving,
      };
    case "dog_tag":
      return {
        ...base,
        kind: "dog_tag",
        birthday: row.birthday!,
        bloodType: row.bloodType!,
      };
    case "pin":
      return { ...base, kind: "pin" };
    case "other":
      return { ...base, kind: "other", description: row.description! };
  }
}

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
          items: items.map(toItemInput),
        }}
      />
    </div>
  );
}
