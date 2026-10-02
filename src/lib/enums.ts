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
