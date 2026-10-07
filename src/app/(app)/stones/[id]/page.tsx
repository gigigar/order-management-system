import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { stone } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { StoneForm } from "../stone-form";

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
      <h1 className="text-xl font-semibold">Edit Stone</h1>
      <StoneForm id={found.id} defaultValues={{ name: found.name }} />
    </div>
  );
}
