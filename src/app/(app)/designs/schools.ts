import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { area, school } from "@/db/schema";

// Schools for the Design form's dropdown, with their Area so same-named Schools differ.
export function schoolOptions() {
  return db
    .select({ id: school.id, name: school.name, areaName: area.name })
    .from(school)
    .innerJoin(area, eq(school.areaId, area.id))
    .orderBy(asc(school.name), asc(area.name));
}
