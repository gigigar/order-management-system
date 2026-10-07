import { asc } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { stone } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { StoneForm } from "./stone-form";

export default async function StonesPage() {
  await requireUser();
  const stones = await db.select().from(stone).orderBy(asc(stone.name));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Stones</h1>
      <StoneForm />
      {stones.length === 0 ? (
        <p>No Stones yet.</p>
      ) : (
        <ul className="divide-y rounded border">
          {stones.map((a) => (
            <li key={a.id} className="flex justify-between p-3">
              <span>{a.name}</span>
              <Link href={`/stones/${a.id}`} className="underline">
                Edit <span className="sr-only">{a.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
