"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  StaleRowError,
  syncItems,
  withOrderCodeRetry,
} from "@/db/save-helpers";
import { agentCredit, order } from "@/db/schema";
import { fieldErrorsOf, type ActionResult } from "@/lib/action-result";
import { creditsFrom } from "@/lib/agent-credits";
import { generateOrderCode } from "@/lib/order-code";
import { requireUser } from "@/lib/session";
import {
  individualOrderSchema,
  rowId,
  type IndividualOrderInput,
} from "@/lib/validation";

// itemIds are in the same order as the items sent, so the form can fill in new ids.
type SaveOrderResult =
  | { ok: true; id: number; itemIds: number[] }
  | Extract<ActionResult, { ok: false }>;

export async function saveIndividualOrder(
  id: number | null,
  input: IndividualOrderInput,
): Promise<SaveOrderResult> {
  const user = await requireUser();
  const parsedId = rowId.parse(id);
  const parsed = individualOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsOf(parsed.error) };
  }
  const { agentId, secondAgentId, secondAgentShare, items, ...fields } =
    parsed.data;
  const credits = creditsFrom({ agentId, secondAgentId, secondAgentShare });

  // One transaction: the Order, its items and its Agent credits save together.
  const save = () =>
    db.transaction(async (tx) => {
      let orderId: number;
      if (parsedId === null) {
        const [created] = await tx
          .insert(order)
          .values({
            ...fields,
            code: generateOrderCode(),
            createdBy: user.id,
            updatedBy: user.id,
          })
          .returning({ id: order.id });
        orderId = created.id;
      } else {
        // Only Individual orders: School orders are edited in their Batch.
        const [updated] = await tx
          .update(order)
          .set({ ...fields, updatedBy: user.id })
          .where(and(eq(order.id, parsedId), isNull(order.batchId)))
          .returning({ id: order.id });
        if (!updated) return null;
        orderId = updated.id;
        await tx.delete(agentCredit).where(eq(agentCredit.orderId, orderId));
      }

      const itemIds = await syncItems(tx, { orderId }, items);

      if (credits.length > 0) {
        await tx
          .insert(agentCredit)
          .values(credits.map((c) => ({ ...c, orderId })));
      }
      return { orderId, itemIds };
    });

  let saved;
  try {
    saved = await withOrderCodeRetry(save);
  } catch (error) {
    if (error instanceof StaleRowError) {
      return {
        ok: false,
        formError: "Someone else changed this Order. Reload and try again.",
      };
    }
    throw error;
  }

  if (saved === null) {
    return { ok: false, formError: "This Order no longer exists." };
  }
  revalidatePath("/orders");
  return { ok: true, id: saved.orderId, itemIds: saved.itemIds };
}
