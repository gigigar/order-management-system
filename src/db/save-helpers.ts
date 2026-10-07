import "server-only";
import { and, eq, notInArray } from "drizzle-orm";
import { isUniqueViolation } from "@/lib/action-result";
import { itemColumns } from "@/lib/items";
import type { ItemInput } from "@/lib/validation";
import { db } from "./index";
import { item } from "./schema";

// Shared by the Server Actions that save Orders and their items.

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Thrown inside a transaction to roll it back: a row id the browser sent doesn't
// belong where it says (tampered), or was deleted since the page loaded.
export class StaleRowError extends Error {}

// Items keep their ids when edited (Commission will point at them from Oct 31), so:
// delete the removed ones, update the kept ones, insert the new ones.
// Returns the saved ids in the same order as `items`, so the form can fill in new ids.
export async function syncItems(
  tx: Tx,
  parent: { orderId: number } | { batchId: number },
  items: ItemInput[],
): Promise<number[]> {
  const belongs =
    "orderId" in parent
      ? eq(item.orderId, parent.orderId)
      : eq(item.batchId, parent.batchId);
  const keptIds = items.flatMap((i) => (i.id === null ? [] : [i.id]));
  await tx
    .delete(item)
    .where(
      keptIds.length > 0 ? and(belongs, notInArray(item.id, keptIds)) : belongs,
    );

  const ids: number[] = [];
  for (const i of items) {
    if (i.id === null) {
      const [created] = await tx
        .insert(item)
        .values({ ...itemColumns(i), ...parent })
        .returning({ id: item.id });
      ids.push(created.id);
      continue;
    }
    const [kept] = await tx
      .update(item)
      .set(itemColumns(i))
      .where(and(eq(item.id, i.id), belongs))
      .returning({ id: item.id });
    if (!kept) throw new StaleRowError();
    ids.push(kept.id);
  }
  return ids;
}

// 31^6 ≈ 887 million codes, so a clash is rare; 3 attempts makes it practically never.
const CODE_ATTEMPTS = 3;

// Runs a transaction that may create Orders, again if a new Order code clashed.
// A failed statement aborts the whole transaction, so the retry redoes all of it.
export async function withOrderCodeRetry<T>(
  save: () => Promise<T>,
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await save();
    } catch (error) {
      if (
        attempt < CODE_ATTEMPTS &&
        isUniqueViolation(error, "order_code_unique")
      ) {
        continue;
      }
      throw error;
    }
  }
}
