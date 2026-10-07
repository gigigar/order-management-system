import type { item } from "../db/schema";
import type { KARATS } from "./enums";
import { toCentavos, toPesos } from "./money";
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

type Karat = (typeof KARATS)[number];

// Database row → form row: centavos back to pesos, and only the kind's own fields.
// The item_*_is_complete CHECKs guarantee each kind's fields are filled, hence the !s.
export function itemInputFromRow(row: typeof item.$inferSelect): ItemInput {
  const base = {
    id: row.id,
    quantity: row.quantity,
    unitPrice: toPesos(row.unitPrice),
  };
  switch (row.kind) {
    case "ring":
      return {
        ...base,
        kind: "ring",
        ringType: row.ringType!,
        material: row.material!,
        // The item_karat_only_for_gold CHECK keeps it to 10, 14 or 18.
        karat: row.karat as Karat | null,
        size: row.size!,
        face: row.face!,
        stoneId: row.stoneId,
        engraving: row.engraving,
      };
    case "dog_tag":
      return {
        ...base,
        kind: "dog_tag",
        birthday: row.birthday!,
        bloodType: row.bloodType!,
      };
    case "pin":
      return { ...base, kind: "pin" };
    case "other":
      return { ...base, kind: "other", description: row.description! };
  }
}
