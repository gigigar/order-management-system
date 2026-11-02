import type { ProductionStage } from "./enums";

// The coarse, public view of an Order's progress. The public status lookup shows
// only this, so internal Stages like "casting" never reach a Customer.
export const STATUSES = [
  "received",
  "in_production",
  "ready",
  "delivered",
] as const;

export type Status = (typeof STATUSES)[number];

export const statusLabels: Record<Status, string> = {
  received: "Received",
  in_production: "In production",
  ready: "Ready",
  delivered: "Delivered",
};

// A Record, so adding a Stage without a Status is a compile error.
const statusByStage: Record<ProductionStage, Status> = {
  order_received: "received",
  mold: "in_production",
  casting: "in_production",
  finishing: "in_production",
  finalizing: "in_production",
  ready: "ready",
  delivered: "delivered",
};

export function stageToStatus(stage: ProductionStage): Status {
  return statusByStage[stage];
}
