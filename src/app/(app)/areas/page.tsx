import { asc } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { area } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { AreaForm } from "./area-form";
import { FormAndList } from "@/components/form-and-list";
import { PageHeader } from "@/components/page-header";

export default async function AreasPage() {
  await requireUser();
  const areas = await db.select().from(area).orderBy(asc(area.name));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Areas" description="Regions the Agents cover." />
      <FormAndList form={<AreaForm />}>
        {areas.length === 0 ? (
          <p>No Areas yet.</p>
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {areas.map((a) => (
              <li key={a.id} className="flex justify-between gap-3 p-3">
                <span>
                  {a.name}
                  {a.address && (
                    <span className="block text-sm text-muted-foreground">
                      {a.address}
                    </span>
                  )}
                </span>
                <Link href={`/areas/${a.id}`} className="underline">
                  Edit <span className="sr-only">{a.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </FormAndList>
    </div>
  );
}
