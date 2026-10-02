"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { invite, session, user } from "@/db/schema";
import {
  fieldErrorsOf,
  isUniqueViolation,
  type ActionResult,
} from "@/lib/action-result";
import { requireAdmin } from "@/lib/session";
import { inviteSchema, rowId, type InviteInput } from "@/lib/validation";

export async function addInvite(input: InviteInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsOf(parsed.error) };
  }

  try {
    await db.insert(invite).values(parsed.data);
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        fieldErrors: { email: "This email is already invited." },
      };
    }
    throw error;
  }

  revalidatePath("/invites");
  return { ok: true };
}

// Removing an invite also ends that person's open sessions, so they're signed out
// now instead of at their next sign-in (when the sign-in hook would refuse them).
export async function removeInvite(id: number): Promise<void> {
  await requireAdmin();
  const inviteId = rowId.unwrap().parse(id);

  await db.transaction(async (tx) => {
    const [removed] = await tx
      .delete(invite)
      .where(eq(invite.id, inviteId))
      .returning({ email: invite.email });
    if (!removed) return;

    const affected = tx
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, removed.email));
    await tx.delete(session).where(inArray(session.userId, affected));
  });

  revalidatePath("/invites");
}
