import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { stone } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { StoneForm } from "../stone-form";
import { PageHeader } from "@/components/page-header";

export default async function EditStonePage({
  params,
}: PageProps<"/stones/[id]">) {
  await requireUser();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [found] = await db.select().from(stone).where(eq(stone.id, id));
  if (!found) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Edit Stone" />
      <StoneForm id={found.id} defaultValues={{ name: found.name }} />
    </div>
  );
}
