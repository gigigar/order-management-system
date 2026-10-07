// Stage values and their labels, shared by the database schema and the UI.
// Kept free of database imports so client components can use them too.

export const DEAL_STAGES = [
  "meeting",
  "design_presented",
  "agreement_signed",
] as const;

export const PRODUCTION_STAGES = [
  "order_received",
  "mold",
  "casting",
  "finishing",
  "finalizing",
  "ready",
  "delivered",
] as const;

export type DealStage = (typeof DEAL_STAGES)[number];
export type ProductionStage = (typeof PRODUCTION_STAGES)[number];

export const dealStageLabels: Record<DealStage, string> = {
  meeting: "Meeting",
  design_presented: "Design presented",
  agreement_signed: "Agreement signed",
};

export const productionStageLabels: Record<ProductionStage, string> = {
  order_received: "Order received",
  mold: "Mold",
  casting: "Casting",
  finishing: "Finishing",
  finalizing: "Finalizing",
  ready: "Ready",
  delivered: "Delivered",
};

// Item values, also shared by the schema and the UI.

export const ITEM_KINDS = ["ring", "dog_tag", "pin", "other"] as const;

// Batch items are for the whole Batch; rings and dog tags are always one student's.
export const BATCH_ITEM_KINDS = ["pin", "other"] as const;

export const RING_TYPES = [
  "megabull",
  "superbull",
  "bullring",
  "semibull",
  "mens_standard",
  "unisex",
  "ladies",
] as const;

export const MATERIALS = ["gold", "silver", "velum"] as const;

export const KARATS = [10, 14, 18] as const;

// What's set on top of a ring (CONTEXT.md: Face).
export const FACES = ["stone", "logo"] as const;

export const BLOOD_TYPES = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
] as const;

export type ItemKind = (typeof ITEM_KINDS)[number];
export type BatchItemKind = (typeof BATCH_ITEM_KINDS)[number];
export type RingType = (typeof RING_TYPES)[number];
export type Material = (typeof MATERIALS)[number];
export type Face = (typeof FACES)[number];

export const itemKindLabels: Record<ItemKind, string> = {
  ring: "Ring",
  dog_tag: "Dog tag",
  pin: "Pin",
  other: "Other item",
};

export const ringTypeLabels: Record<RingType, string> = {
  megabull: "Megabull",
  superbull: "Superbull",
  bullring: "Bullring",
  semibull: "Semibull",
  mens_standard: "Men's standard",
  unisex: "Unisex",
  ladies: "Ladies",
};

export const materialLabels: Record<Material, string> = {
  gold: "Gold",
  silver: "Silver",
  velum: "Velum",
};

export const faceLabels: Record<Face, string> = {
  stone: "Stone",
  logo: "Logo",
};
