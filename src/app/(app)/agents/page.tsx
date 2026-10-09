import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { area, agent } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { AgentForm } from "./agent-form";

export default async function AgentsPage() {
  await requireUser();
  const [rows, areas] = await Promise.all([
    db
      .select({ id: agent.id, name: agent.name, areaName: area.name })
      .from(agent)
      .innerJoin(area, eq(agent.areaId, area.id))
      .orderBy(asc(agent.name)),
    db
      .select({ id: area.id, name: area.name })
      .from(area)
      .orderBy(asc(area.name)),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Agents</h1>
      {areas.length === 0 ? (
        <p>
          Add an{" "}
          <Link href="/areas" className="underline">
            Area
          </Link>{" "}
          first.
        </p>
      ) : (
        <AgentForm areas={areas} />
      )}
      {rows.length === 0 ? (
        <p>No Agents yet.</p>
      ) : (
        <ul className="divide-y rounded border">
          {rows.map((row) => (
            <li key={row.id} className="flex justify-between gap-3 p-3">
              <span>
                {row.name}{" "}
                <span className="text-muted-foreground">· {row.areaName}</span>
              </span>
              <Link href={`/agents/${row.id}`} className="underline">
                Edit <span className="sr-only">{row.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
