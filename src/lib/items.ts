import type { item } from "../db/schema";
import { toCentavos } from "./money";
import type { ItemInput } from "./validation";

// One item table with nullable columns (design doc trade-off): each kind fills its
// own columns and leaves the others null, so changing a ring to a pin clears its
// ring fields too.
type ItemColumns = Required<
  Omit<
    typeof item.$inferInsert,
    "id" | "orderId" | "batchId" | "createdAt" | "updatedAt"
  >
>;

export function itemColumns(input: ItemInput): ItemColumns {
  const columns: ItemColumns = {
    kind: input.kind,
    quantity: input.quantity,
    unitPrice: toCentavos(input.unitPrice),
    ringType: null,
    material: null,
    karat: null,
    size: null,
    face: null,
    stoneId: null,
    engraving: null,
    birthday: null,
    bloodType: null,
    description: null,
  };
  switch (input.kind) {
    case "ring":
      return {
        ...columns,
        ringType: input.ringType,
        material: input.material,
        // Karat only for gold (item_karat_only_for_gold CHECK).
        karat: input.material === "gold" ? input.karat : null,
        size: input.size,
        face: input.face,
        stoneId: input.face === "stone" ? input.stoneId : null,
        engraving: input.engraving,
      };
    case "dog_tag":
      return {
        ...columns,
        birthday: input.birthday,
        bloodType: input.bloodType,
      };
    case "pin":
      return columns;
    case "other":
      return { ...columns, description: input.description };
  }
}
