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

// One line per Order for lists, e.g. "Superbull ring, 14k gold · Pin ×30".
export function itemSummary(items: SummaryItem[]): string {
  return items
    .map((i) => {
      const name =
        i.kind === "ring" && i.ringType && i.material
          ? `${ringTypeLabels[i.ringType]} ring, ${i.karat ? `${i.karat}k ` : ""}${materialLabels[i.material].toLowerCase()}`
          : i.kind === "other" && i.description
            ? i.description
            : itemKindLabels[i.kind];
      return i.quantity > 1 ? `${name} ×${i.quantity}` : name;
    })
    .join(" · ");
}
