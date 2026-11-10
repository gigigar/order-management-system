import { describe, expect, it } from "vitest";
import { openBalances } from "./balances";

const row = (id: number, owed: number, paid: number) => ({
  id,
  name: `Entry ${id}`,
  dueDate: null,
  owed,
  paid,
});

describe("openBalances", () => {
  it("lists what's still owed, largest first, across both kinds", () => {
    const { rows, total } = openBalances(
      [row(1, 1_000, 900)],
      [row(2, 5_000, 1_000)],
    );
    expect(rows.map((r) => [r.kind, r.id, r.balance])).toEqual([
      ["order", 2, 4_000],
      ["batch", 1, 100],
    ]);
    expect(total).toBe(4_100);
  });

  it("drops fully paid entries", () => {
    expect(openBalances([row(1, 1_000, 1_000)], []).rows).toEqual([]);
  });

  it("doesn't let an overpayment reduce another entry's balance", () => {
    const { total } = openBalances([row(1, 1_000, 3_000)], [row(2, 1_000, 0)]);
    expect(total).toBe(1_000);
  });

  it("totals zero when nothing is owed", () => {
    expect(openBalances([], [])).toEqual({ rows: [], total: 0 });
  });
});
