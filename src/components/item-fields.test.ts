import { describe, expect, it } from "vitest";
import { itemSchema } from "@/lib/validation";
import { blankItem } from "./item-fields";

// What the form sends: blankItem() plus only the inputs on screen. Karat shows only
// for gold and Stone only for a stone Face, so a test passing them as null by hand
// would miss a blank row that leaves them undefined.
const ring = (shown: object) => ({
  ...blankItem("ring"),
  quantity: 1,
  unitPrice: 1000,
  ringType: "superbull",
  size: 7,
  engraving: null,
  ...shown,
});

describe("blankItem", () => {
  it.each([
    [
      "gold with a stone",
      { material: "gold", karat: 14, face: "stone", stoneId: 1 },
    ],
    ["gold with a logo", { material: "gold", karat: 14, face: "logo" }],
    ["silver with a stone", { material: "silver", face: "stone", stoneId: 1 }],
    ["silver with a logo", { material: "silver", face: "logo" }],
    ["velum with a logo", { material: "velum", face: "logo" }],
  ])("lets a ring save: %s", (_, shown) => {
    expect(itemSchema.safeParse(ring(shown)).success).toBe(true);
  });

  // The errors have to land on inputs that are on screen.
  it("still asks a gold ring for its karat", () => {
    const result = itemSchema.safeParse(
      ring({ material: "gold", face: "logo" }),
    );
    expect(result.error?.issues[0].path).toEqual(["karat"]);
    expect(result.error?.issues[0].message).toBe("Choose the karat");
  });

  it("still asks a stone Face for its stone", () => {
    const result = itemSchema.safeParse(
      ring({ material: "silver", face: "stone" }),
    );
    expect(result.error?.issues[0].path).toEqual(["stoneId"]);
    expect(result.error?.issues[0].message).toBe("Choose the stone");
  });
});
