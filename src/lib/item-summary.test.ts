import { describe, expect, it } from "vitest";
import { itemSummary } from "./item-summary";

const none = { ringType: null, material: null, karat: null, description: null };

describe("itemSummary", () => {
  it("names a gold ring with its type and karat", () => {
    expect(
      itemSummary([
        {
          ...none,
          kind: "ring",
          quantity: 1,
          ringType: "superbull",
          material: "gold",
          karat: 14,
        },
      ]),
    ).toBe("Superbull ring, 14k gold (1)");
  });

  it("leaves out karat for other materials", () => {
    expect(
      itemSummary([
        {
          ...none,
          kind: "ring",
          quantity: 1,
          ringType: "ladies",
          material: "silver",
        },
      ]),
    ).toBe("Ladies ring, silver (1)");
  });

  it("shows every quantity and separates items with semicolons", () => {
    expect(
      itemSummary([
        { ...none, kind: "dog_tag", quantity: 1 },
        { ...none, kind: "pin", quantity: 30 },
      ]),
    ).toBe("Dog tag (1); Pin (30)");
  });

  it("uses an Other item's description", () => {
    expect(
      itemSummary([
        { ...none, kind: "other", quantity: 2, description: "Medal" },
      ]),
    ).toBe("Medal (2)");
  });

  it("adds up identical products across a Batch", () => {
    const gold14 = {
      ...none,
      kind: "ring",
      quantity: 1,
      ringType: "superbull",
      material: "gold",
      karat: 14,
    } as const;
    expect(
      itemSummary([
        gold14,
        { ...none, kind: "dog_tag", quantity: 1 },
        gold14,
        { ...gold14, karat: 18 },
        { ...none, kind: "pin", quantity: 30 },
      ]),
    ).toBe(
      "Superbull ring, 14k gold (2); Dog tag (1); Superbull ring, 18k gold (1); Pin (30)",
    );
  });

  it("is empty for an Order with no items", () => {
    expect(itemSummary([])).toBe("");
  });
});
