type Row = {
  id: number;
  name: string;
  dueDate: string | null;
  owed: number;
  paid: number;
};

export type OpenBalance = Row & { kind: "batch" | "order"; balance: number };

// Who still owes money, largest first. Fully paid and overpaid entries drop out, so an
// overpayment on one entry never hides what another still owes. Amounts are centavos.
export function openBalances(
  batches: Row[],
  orders: Row[],
): { rows: OpenBalance[]; total: number } {
  const rows = [
    ...batches.map((r) => ({ ...r, kind: "batch" as const })),
    ...orders.map((r) => ({ ...r, kind: "order" as const })),
  ]
    .map((r) => ({ ...r, balance: r.owed - r.paid }))
    .filter((r) => r.balance > 0)
    .sort((a, b) => b.balance - a.balance || a.id - b.id);

  return { rows, total: rows.reduce((sum, r) => sum + r.balance, 0) };
}
