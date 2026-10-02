import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { area, school } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { SchoolForm } from "./school-form";

export default async function SchoolsPage() {
  await requireUser();
  const [rows, areas] = await Promise.all([
    db
      .select({ id: school.id, name: school.name, areaName: area.name })
      .from(school)
      .innerJoin(area, eq(school.areaId, area.id))
      .orderBy(asc(school.name)),
    db
      .select({ id: area.id, name: area.name })
      .from(area)
      .orderBy(asc(area.name)),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Schools</h1>
      {areas.length === 0 ? (
        <p>
          Add an{" "}
          <Link href="/areas" className="underline">
            Area
          </Link>{" "}
          first.
        </p>
      ) : (
        <SchoolForm areas={areas} />
      )}
      {rows.length === 0 ? (
        <p>No Schools yet.</p>
      ) : (
        <ul className="divide-y rounded border">
          {rows.map((row) => (
            <li key={row.id} className="flex justify-between gap-3 p-3">
              <span>
                {row.name}{" "}
                <span className="text-gray-600">· {row.areaName}</span>
              </span>
              <Link href={`/schools/${row.id}`} className="underline">
                Edit <span className="sr-only">{row.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
