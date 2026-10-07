import { describe, expect, it } from "vitest";
import { z } from "zod";
import { fieldErrorsOf, isUniqueViolation } from "./action-result";

describe("fieldErrorsOf", () => {
  it("keeps the first message per field", () => {
    const schema = z.object({
      name: z.string().min(1, "Required").min(3, "Too short"),
      areaId: z.number({ error: "Choose an Area" }),
    });
    const result = schema.safeParse({ name: "", areaId: NaN });
    expect(fieldErrorsOf(result.error!)).toEqual({
      name: "Required",
      areaId: "Choose an Area",
    });
  });

  it("joins nested paths the way React Hook Form names fields", () => {
    const schema = z.object({ items: z.array(z.object({ size: z.number() })) });
    const result = schema.safeParse({ items: [{ size: 7 }, { size: "x" }] });
    expect(Object.keys(fieldErrorsOf(result.error!))).toEqual(["items.1.size"]);
  });
});

describe("isUniqueViolation", () => {
  it("finds code 23505 on the error itself", () => {
    expect(isUniqueViolation({ code: "23505" })).toBe(true);
  });

  it("finds code 23505 on a wrapped error's cause", () => {
    const wrapped = new Error("Failed query", { cause: { code: "23505" } });
    expect(isUniqueViolation(wrapped)).toBe(true);
  });

  it("can match one constraint only", () => {
    const error = { code: "23505", constraint: "order_code_unique" };
    expect(isUniqueViolation(error, "order_code_unique")).toBe(true);
    expect(isUniqueViolation(error, "school_area_id_name_unique")).toBe(false);
  });

  it("ignores other database errors", () => {
    expect(isUniqueViolation({ code: "23503" })).toBe(false); // foreign key
    expect(isUniqueViolation(new Error("boom"))).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
  });
});
