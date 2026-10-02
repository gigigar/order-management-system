import { asc } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { area } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { AreaForm } from "./area-form";

export default async function AreasPage() {
  await requireUser();
  const areas = await db.select().from(area).orderBy(asc(area.name));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Areas</h1>
      <AreaForm />
      {areas.length === 0 ? (
        <p>No Areas yet.</p>
      ) : (
        <ul className="divide-y rounded border">
          {areas.map((a) => (
            <li key={a.id} className="flex justify-between p-3">
              <span>{a.name}</span>
              <Link href={`/areas/${a.id}`} className="underline">
                Edit <span className="sr-only">{a.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
