import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { agentCredit, batch, school } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { BatchForm } from "../batch-form";
import { batchFormOptions } from "../options";

export default async function BatchPage({
  params,
}: PageProps<"/batches/[id]">) {
  await requireUser();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [[found], credits, options] = await Promise.all([
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
  ]);
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
      <section className="flex flex-col gap-2 border-t pt-4">
        <h2 className="font-semibold">Orders</h2>
        <p className="text-sm text-gray-600">
          The Batch entry table comes in the next update.
        </p>
      </section>
    </div>
  );
}
