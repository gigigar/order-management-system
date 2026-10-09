import { describe, expect, it } from "vitest";
import { dueLabel, dueSections } from "./dashboard";

const today = "2026-10-09";
const row = (id: number, name: string, dueDate: string | null) => ({
  id,
  name,
  dueDate,
  stage: "casting" as const,
  owed: 500_000,
  paid: 200_000,
});

describe("dueSections", () => {
  it("splits on today: past Due dates are Overdue, today onward Due soon", () => {
    const { overdue, dueSoon } = dueSections(
      [row(1, "Ateneo", "2026-10-08")],
      [row(2, "Ana", "2026-10-09")],
      today,
    );
    expect(overdue.map((r) => r.id)).toEqual([1]);
    expect(dueSoon.map((r) => r.id)).toEqual([2]);
  });

  it("mixes Batches and Individual orders, most late first", () => {
    const { overdue } = dueSections(
      [row(1, "Ateneo", "2026-10-07")],
      [row(2, "Ana", "2026-10-01")],
      today,
    );
    expect(overdue.map((r) => [r.kind, r.daysLeft])).toEqual([
      ["individual", -8],
      ["batch", -2],
    ]);
  });

  it("shows the Balance: owed minus paid", () => {
    const { dueSoon } = dueSections(
      [row(1, "Ateneo", "2026-10-12")],
      [],
      today,
    );
    expect(dueSoon[0].balance).toBe(300_000);
  });

  it("skips rows without a Due date", () => {
    const { overdue, dueSoon } = dueSections(
      [row(1, "Ateneo", null)],
      [],
      today,
    );
    expect([...overdue, ...dueSoon]).toEqual([]);
  });
});

describe("dueLabel", () => {
  it("says late, today or in N days", () => {
    expect(dueLabel(-3)).toBe("3 days late");
    expect(dueLabel(-1)).toBe("1 day late");
    expect(dueLabel(0)).toBe("Due today");
    expect(dueLabel(4)).toBe("In 4 days");
  });
});
