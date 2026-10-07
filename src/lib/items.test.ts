import { describe, expect, it } from "vitest";
import { itemColumns } from "./items";
import { itemSchema } from "./validation";

const ring = {
  id: null,
  kind: "ring",
  quantity: 1,
  unitPrice: 4500.5,
  ringType: "superbull",
  material: "gold",
  karat: 14,
  size: 7.5,
  face: "stone",
  stoneId: 1,
  engraving: "JDC 2027",
} as const;

describe("itemSchema", () => {
  it("accepts a complete ring", () => {
    expect(itemSchema.safeParse(ring).success).toBe(true);
  });

  it("asks for the karat on gold rings", () => {
    const result = itemSchema.safeParse({ ...ring, karat: null });
    expect(result.error?.issues[0].path).toEqual(["karat"]);
  });

  it("asks for the stone when the Face is a stone", () => {
    const result = itemSchema.safeParse({ ...ring, stoneId: null });
    expect(result.error?.issues[0].path).toEqual(["stoneId"]);
  });

  it("accepts a logo ring without a stone or engraving", () => {
    const logo = { ...ring, face: "logo", stoneId: null, engraving: null };
    expect(itemSchema.safeParse(logo).success).toBe(true);
  });

  it("only allows whole and half sizes", () => {
    expect(itemSchema.safeParse({ ...ring, size: 7.25 }).success).toBe(false);
  });

  it("rejects prices with more than 2 decimals", () => {
    expect(itemSchema.safeParse({ ...ring, unitPrice: 1.005 }).success).toBe(
      false,
    );
    expect(itemSchema.safeParse({ ...ring, unitPrice: 19.99 }).success).toBe(
      true,
    );
  });

  it("drops fields that belong to another kind", () => {
    const parsed = itemSchema.parse({
      id: null,
      kind: "pin",
      quantity: 30,
      unitPrice: 150,
      engraving: "left over from a ring",
    });
    expect(parsed).not.toHaveProperty("engraving");
  });

  it("asks a dog tag for its birthday and blood type", () => {
    const result = itemSchema.safeParse({
      id: null,
      kind: "dog_tag",
      quantity: 1,
      unitPrice: 800,
    });
    const fields = result.error?.issues.map((i) => i.path[0]);
    expect(fields).toEqual(["birthday", "bloodType"]);
  });
});

describe("itemColumns", () => {
  it("saves prices as centavos", () => {
    expect(itemColumns(itemSchema.parse(ring)).unitPrice).toBe(450050);
  });

  it("clears karat when the ring isn't gold", () => {
    const silver = itemSchema.parse({ ...ring, material: "silver", karat: 14 });
    expect(itemColumns(silver).karat).toBeNull();
  });

  it("drops a stone left over from before switching to logo", () => {
    const logo = itemSchema.parse({ ...ring, face: "logo", stoneId: 3 });
    expect(itemColumns(logo)).toMatchObject({ face: "logo", stoneId: null });
  });

  it("leaves other kinds' columns null", () => {
    const pin = itemColumns(
      itemSchema.parse({ id: null, kind: "pin", quantity: 30, unitPrice: 150 }),
    );
    expect(pin).toMatchObject({
      kind: "pin",
      quantity: 30,
      unitPrice: 15000,
      ringType: null,
      engraving: null,
      birthday: null,
      description: null,
    });
  });
});
