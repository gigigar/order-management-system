import { asc, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { design, school } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { DesignForm } from "./design-form";
import { schoolOptions } from "./schools";

export default async function DesignsPage() {
  await requireUser();
  const [rows, schools] = await Promise.all([
    db
      .select({
        id: design.id,
        year: design.year,
        description: design.description,
        schoolName: school.name,
      })
      .from(design)
      .innerJoin(school, eq(design.schoolId, school.id))
      .orderBy(asc(school.name), desc(design.year)),
    schoolOptions(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Designs</h1>
      {schools.length === 0 ? (
        <p>
          Add a{" "}
          <Link href="/schools" className="underline">
            School
          </Link>{" "}
          first.
        </p>
      ) : (
        <DesignForm schools={schools} />
      )}
      {rows.length === 0 ? (
        <p>No Designs yet.</p>
      ) : (
        <ul className="divide-y rounded border">
          {rows.map((row) => (
            <li key={row.id} className="flex justify-between gap-3 p-3">
              <span>
                {row.schoolName}
                {row.year !== null && ` · ${row.year}`}
                <span className="block text-sm text-gray-600">
                  {row.description}
                </span>
              </span>
              <Link href={`/designs/${row.id}`} className="underline">
                Edit{" "}
                <span className="sr-only">
                  {row.schoolName} {row.year}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
