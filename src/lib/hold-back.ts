import type { ProductionStage } from "./enums";

// A School order's own Stage is null while it follows its Batch, and set while it's
// held back. This is the Stage the Order is really at.
export function orderStage(
  own: ProductionStage | null,
  batchStage: ProductionStage,
): ProductionStage {
  return own ?? batchStage;
}

// What to store for a student when the Batch entry table saves. A student rejoins
// the Batch (null) only when a Stage change makes the two match. A new hold at the
// Batch's own Stage has to stay: that's a ring that failed while the rest move on.
export function heldStageToSave({
  saved,
  chosen,
  batchStage,
}: {
  saved: ProductionStage | null;
  chosen: ProductionStage | null;
  batchStage: ProductionStage;
}): ProductionStage | null {
  const moved = saved !== null && chosen !== saved;
  return moved && chosen === batchStage ? null : chosen;
}
