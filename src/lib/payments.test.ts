import { describe, expect, it } from "vitest";
import { paymentSummary } from "./payments";

describe("paymentSummary", () => {
  it("has the whole total remaining before any Payment", () => {
    expect(paymentSummary(500_000, [])).toEqual({
      total: 500_000,
      paid: 0,
      remaining: 500_000,
      overpaid: false,
    });
  });

  it("adds up Payments and subtracts them from the total", () => {
    const summary = paymentSummary(500_000, [
      { amount: 200_000 },
      { amount: 150_050 },
    ]);
    expect(summary.paid).toBe(350_050);
    expect(summary.remaining).toBe(149_950);
    expect(summary.overpaid).toBe(false);
  });

  it("is not overpaid when paid exactly", () => {
    expect(paymentSummary(500_000, [{ amount: 500_000 }]).overpaid).toBe(false);
  });

  it("flags overpaying instead of refusing it", () => {
    const summary = paymentSummary(500_000, [{ amount: 500_100 }]);
    expect(summary.remaining).toBe(-100);
    expect(summary.overpaid).toBe(true);
  });
});
