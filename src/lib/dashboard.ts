import { daysBetween } from "./dates";
import type { ProductionStage } from "./enums";
import { paymentSummary } from "./payments";

type Row = {
  id: number;
  name: string;
  dueDate: string | null;
  stage: ProductionStage | null;
  owed: number;
  paid: number;
};

export type DueRow = {
  kind: "batch" | "individual";
  id: number;
  name: string;
  dueDate: string;
  stage: ProductionStage | null;
  // Negative = days late; 0 = due today; positive = days left.
  daysLeft: number;
  balance: number;
};

// Batches and Individual orders in one list, split into Overdue and Due soon, each
// sorted by Due date (most late first, then soonest). The query already kept only
// open work due within 7 days.
export function dueSections(
  batches: Row[],
  orders: Row[],
  today: string,
): { overdue: DueRow[]; dueSoon: DueRow[] } {
  const toRow = (kind: DueRow["kind"], r: Row): DueRow[] =>
    r.dueDate === null
      ? []
      : [
          {
            kind,
            id: r.id,
            name: r.name,
            dueDate: r.dueDate,
            stage: r.stage,
            daysLeft: daysBetween(today, r.dueDate),
            balance: paymentSummary(r.owed, [{ amount: r.paid }]).remaining,
          },
        ];
  const rows = [
    ...batches.flatMap((b) => toRow("batch", b)),
    ...orders.flatMap((o) => toRow("individual", o)),
  ].sort((a, b) => a.daysLeft - b.daysLeft || a.name.localeCompare(b.name));
  return {
    overdue: rows.filter((r) => r.daysLeft < 0),
    dueSoon: rows.filter((r) => r.daysLeft >= 0),
  };
}

// "3 days late", "due today", "in 1 day".
export function dueLabel(daysLeft: number): string {
  if (daysLeft === 0) return "Due today";
  const n = Math.abs(daysLeft);
  const days = n === 1 ? "1 day" : `${n} days`;
  return daysLeft < 0 ? `${days} late` : `In ${days}`;
}
