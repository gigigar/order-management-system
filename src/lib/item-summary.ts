import {
  itemKindLabels,
  materialLabels,
  ringTypeLabels,
  type ItemKind,
  type Material,
  type RingType,
} from "./enums";

type SummaryItem = {
  kind: ItemKind;
  quantity: number;
  ringType: RingType | null;
  material: Material | null;
  karat: number | null;
  description: string | null;
};

// One line per Order or Batch for lists, e.g. "Superbull ring, 14k gold (25); Pin (30)".
// Identical products are added up, in the order they first appear.
export function itemSummary(items: SummaryItem[]): string {
  const quantities = new Map<string, number>();
  for (const i of items) {
    const name =
      i.kind === "ring" && i.ringType && i.material
        ? `${ringTypeLabels[i.ringType]} ring, ${i.karat ? `${i.karat}k ` : ""}${materialLabels[i.material].toLowerCase()}`
        : i.kind === "other" && i.description
          ? i.description
          : itemKindLabels[i.kind];
    quantities.set(name, (quantities.get(name) ?? 0) + i.quantity);
  }
  return [...quantities]
    .map(([name, quantity]) => `${name} (${quantity})`)
    .join("; ");
}
