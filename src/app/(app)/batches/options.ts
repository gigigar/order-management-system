import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { agent, area, design, school } from "@/db/schema";

// Dropdown choices for the Batch form.
export async function batchFormOptions() {
  const [schools, designs, agents] = await Promise.all([
    db
      .select({ id: school.id, name: school.name, areaName: area.name })
      .from(school)
      .innerJoin(area, eq(school.areaId, area.id))
      .orderBy(asc(school.name), asc(area.name)),
    db
      .select({
        id: design.id,
        schoolId: design.schoolId,
        year: design.year,
        description: design.description,
      })
      .from(design)
      .orderBy(asc(design.year)),
    db
      .select({ id: agent.id, name: agent.name, areaName: area.name })
      .from(agent)
      .innerJoin(area, eq(agent.areaId, area.id))
      .orderBy(asc(agent.name)),
  ]);
  return { schools, designs, agents };
}

export type BatchFormOptions = Awaited<ReturnType<typeof batchFormOptions>>;
