import { describe, expect, it } from "vitest";
import { dueStatus, todayInManila } from "./dates";

describe("todayInManila", () => {
  it("is already tomorrow in Manila when it's evening in UTC", () => {
    // 17:00 UTC on Oct 2 = 01:00 on Oct 3 in Manila (UTC+8).
    expect(todayInManila(new Date("2026-10-02T17:00:00Z"))).toBe("2026-10-03");
  });
});

describe("dueStatus", () => {
  const today = "2026-10-02";
  const open = { delivered: false, cancelled: false };

  it("is overdue the day after the Due date", () => {
    expect(dueStatus("2026-10-01", today, open)).toBe("overdue");
  });

  it("is due soon from today through 7 days ahead", () => {
    expect(dueStatus("2026-10-02", today, open)).toBe("due_soon");
    expect(dueStatus("2026-10-09", today, open)).toBe("due_soon");
  });

  it("is neither 8 days ahead", () => {
    expect(dueStatus("2026-10-10", today, open)).toBeNull();
  });

  it("counts across month ends", () => {
    expect(dueStatus("2026-11-03", "2026-10-30", open)).toBe("due_soon");
  });

  it("ignores delivered, cancelled, and undated work", () => {
    const late = "2026-09-01";
    expect(
      dueStatus(late, today, { delivered: true, cancelled: false }),
    ).toBeNull();
    expect(
      dueStatus(late, today, { delivered: false, cancelled: true }),
    ).toBeNull();
    expect(dueStatus(null, today, open)).toBeNull();
  });
});
