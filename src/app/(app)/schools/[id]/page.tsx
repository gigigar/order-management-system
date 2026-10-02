import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { area, school } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { SchoolForm } from "../school-form";

export default async function EditSchoolPage({
  params,
}: PageProps<"/schools/[id]">) {
  await requireUser();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [[found], areas] = await Promise.all([
    db.select().from(school).where(eq(school.id, id)),
    db
      .select({ id: area.id, name: area.name })
      .from(area)
      .orderBy(asc(area.name)),
  ]);
  if (!found) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Edit School</h1>
      <SchoolForm
        id={found.id}
        defaultValues={{ name: found.name, areaId: found.areaId }}
        areas={areas}
      />
    </div>
  );
}
