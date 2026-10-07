import { describe, expect, it } from "vitest";
import { itemColumns, itemInputFromRow } from "./items";
import { batchItemSchema, itemSchema, schoolOrderSchema } from "./validation";

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

describe("itemInputFromRow", () => {
  it("round-trips a saved ring back into the form", () => {
    const parsed = itemSchema.parse(ring);
    const row = {
      ...itemColumns(parsed),
      id: 5,
      orderId: 1,
      batchId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(itemInputFromRow(row)).toEqual({ ...parsed, id: 5 });
  });
});

describe("schoolOrderSchema", () => {
  const student = { id: null, customerName: "Ana Cruz", customerPhone: null };

  it("accepts a student with a ring and an extra dog tag, no phone", () => {
    const dogTag = {
      id: null,
      kind: "dog_tag",
      quantity: 1,
      unitPrice: 0,
      birthday: "2005-03-04",
      bloodType: "O+",
    };
    expect(
      schoolOrderSchema.safeParse({ ...student, items: [ring, dogTag] })
        .success,
    ).toBe(true);
  });

  it("needs the row's first item to be a ring", () => {
    const pin = { id: null, kind: "pin", quantity: 1, unitPrice: 150 };
    expect(
      schoolOrderSchema.safeParse({ ...student, items: [pin] }).success,
    ).toBe(false);
  });

  it("names the cell with the problem", () => {
    const result = schoolOrderSchema.safeParse({
      ...student,
      items: [{ ...ring, size: 7.25 }],
    });
    expect(result.error?.issues[0].path).toEqual(["items", 0, "size"]);
  });
});

describe("batchItemSchema", () => {
  it("allows pins and other items", () => {
    expect(
      batchItemSchema.safeParse({
        id: null,
        kind: "pin",
        quantity: 30,
        unitPrice: 150,
      }).success,
    ).toBe(true);
  });

  it("refuses rings and dog tags, which are always one student's", () => {
    expect(batchItemSchema.safeParse(ring).success).toBe(false);
  });
});
