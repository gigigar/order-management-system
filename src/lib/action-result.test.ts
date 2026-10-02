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
});

describe("isUniqueViolation", () => {
  it("finds code 23505 on the error itself", () => {
    expect(isUniqueViolation({ code: "23505" })).toBe(true);
  });

  it("finds code 23505 on a wrapped error's cause", () => {
    const wrapped = new Error("Failed query", { cause: { code: "23505" } });
    expect(isUniqueViolation(wrapped)).toBe(true);
  });

  it("ignores other database errors", () => {
    expect(isUniqueViolation({ code: "23503" })).toBe(false); // foreign key
    expect(isUniqueViolation(new Error("boom"))).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
  });
});
