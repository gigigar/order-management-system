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
    ).toBe("Superbull ring, 14k gold");
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
    ).toBe("Ladies ring, silver");
  });

  it("shows quantities over 1 and joins items", () => {
    expect(
      itemSummary([
        { ...none, kind: "dog_tag", quantity: 1 },
        { ...none, kind: "pin", quantity: 30 },
      ]),
    ).toBe("Dog tag · Pin ×30");
  });

  it("uses an Other item's description", () => {
    expect(
      itemSummary([
        { ...none, kind: "other", quantity: 2, description: "Medal" },
      ]),
    ).toBe("Medal ×2");
  });

  it("is empty for an Order with no items", () => {
    expect(itemSummary([])).toBe("");
  });
});
