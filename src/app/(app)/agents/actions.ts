"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { agent } from "@/db/schema";
import { fieldErrorsOf, type ActionResult } from "@/lib/action-result";
import { requireUser } from "@/lib/session";
import { agentSchema, rowId, type AgentInput } from "@/lib/validation";

// Same pattern as saveArea: re-check the session and the input on the server.
export async function saveAgent(
  id: number | null,
  input: AgentInput,
): Promise<ActionResult> {
  await requireUser();
  const parsedId = rowId.parse(id);
  const parsed = agentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsOf(parsed.error) };
  }

  if (parsedId === null) {
    await db.insert(agent).values(parsed.data);
  } else {
    await db.update(agent).set(parsed.data).where(eq(agent.id, parsedId));
  }

  revalidatePath("/agents");
  return { ok: true };
}
