import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { design } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { DesignForm } from "../design-form";
import { schoolOptions } from "../schools";
import { PageHeader } from "@/components/page-header";

export default async function EditDesignPage({
  params,
}: PageProps<"/designs/[id]">) {
  await requireUser();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [[found], schools] = await Promise.all([
    db.select().from(design).where(eq(design.id, id)),
    schoolOptions(),
  ]);
  if (!found) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Edit Design" />
      <DesignForm
        id={found.id}
        defaultValues={{
          schoolId: found.schoolId,
          year: found.year,
          description: found.description,
        }}
        schools={schools}
      />
    </div>
  );
}
