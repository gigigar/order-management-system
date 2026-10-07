"use server";

import { and, eq, isNull, notInArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { agentCredit, item, order } from "@/db/schema";
import {
  fieldErrorsOf,
  isUniqueViolation,
  type ActionResult,
} from "@/lib/action-result";
import { creditsFrom } from "@/lib/agent-credits";
import { itemColumns } from "@/lib/items";
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

// Thrown inside the transaction to roll it back.
class StaleItemError extends Error {}

// 31^6 ≈ 887 million codes, so a clash is rare; retrying 3 times makes it practically never.
const CODE_ATTEMPTS = 3;

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

      // Items keep their ids when edited (Commission will point at them from Oct 31),
      // so: delete the removed ones, update the kept ones, insert the new ones.
      const keptIds = items.flatMap((i) => (i.id === null ? [] : [i.id]));
      await tx
        .delete(item)
        .where(
          keptIds.length > 0
            ? and(eq(item.orderId, orderId), notInArray(item.id, keptIds))
            : eq(item.orderId, orderId),
        );
      const itemIds: number[] = [];
      for (const i of items) {
        if (i.id === null) {
          const [created] = await tx
            .insert(item)
            .values({ ...itemColumns(i), orderId })
            .returning({ id: item.id });
          itemIds.push(created.id);
          continue;
        }
        const [kept] = await tx
          .update(item)
          .set(itemColumns(i))
          .where(and(eq(item.id, i.id), eq(item.orderId, orderId)))
          .returning({ id: item.id });
        // An id from another Order (tampered) or one deleted since the page loaded.
        if (!kept) throw new StaleItemError();
        itemIds.push(kept.id);
      }

      if (credits.length > 0) {
        await tx
          .insert(agentCredit)
          .values(credits.map((c) => ({ ...c, orderId })));
      }
      return { orderId, itemIds };
    });

  let saved: { orderId: number; itemIds: number[] } | null = null;
  for (let attempt = 1; ; attempt++) {
    try {
      saved = await save();
      break;
    } catch (error) {
      if (error instanceof StaleItemError) {
        return {
          ok: false,
          formError: "Someone else changed this Order. Reload and try again.",
        };
      }
      // A failed statement aborts the transaction, so retry the whole thing.
      if (
        parsedId === null &&
        attempt < CODE_ATTEMPTS &&
        isUniqueViolation(error, "order_code_unique")
      ) {
        continue;
      }
      throw error;
    }
  }

  if (saved === null) {
    return { ok: false, formError: "This Order no longer exists." };
  }
  revalidatePath("/orders");
  return { ok: true, id: saved.orderId, itemIds: saved.itemIds };
}
