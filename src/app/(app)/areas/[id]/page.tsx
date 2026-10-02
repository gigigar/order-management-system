import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { area } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { AreaForm } from "../area-form";

export default async function EditAreaPage({
  params,
}: PageProps<"/areas/[id]">) {
  await requireUser();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [found] = await db.select().from(area).where(eq(area.id, id));
  if (!found) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Edit Area</h1>
      <AreaForm id={found.id} defaultValues={{ name: found.name }} />
    </div>
  );
}
