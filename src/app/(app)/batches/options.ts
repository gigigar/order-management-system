import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { agent, area, design, school, stone } from "@/db/schema";

// Dropdown choices for the Batch and Order forms.
export async function batchFormOptions() {
  const [schools, designs, agents, stones] = await Promise.all([
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
    db
      .select({ id: stone.id, name: stone.name })
      .from(stone)
      .orderBy(asc(stone.name)),
  ]);
  return { schools, designs, agents, stones };
}

export type BatchFormOptions = Awaited<ReturnType<typeof batchFormOptions>>;
