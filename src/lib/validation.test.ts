import { describe, expect, it } from "vitest";
import {
  areaSchema,
  designSchema,
  inviteSchema,
  rowId,
  schoolSchema,
} from "./validation";

describe("areaSchema", () => {
  it("trims the name", () => {
    expect(areaSchema.parse({ name: "  Cebu  " })).toEqual({ name: "Cebu" });
  });

  it("rejects a name that is only spaces", () => {
    const result = areaSchema.safeParse({ name: "   " });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Required");
  });

  it("rejects names over 100 characters", () => {
    expect(areaSchema.safeParse({ name: "a".repeat(101) }).success).toBe(false);
  });
});

describe("schoolSchema", () => {
  it("accepts a name and an Area", () => {
    expect(schoolSchema.parse({ name: "St. Mary's", areaId: 3 })).toEqual({
      name: "St. Mary's",
      areaId: 3,
    });
  });

  // An unchosen <select> with valueAsNumber gives NaN.
  it("asks for an Area when none is chosen", () => {
    const result = schoolSchema.safeParse({ name: "St. Mary's", areaId: NaN });
    expect(result.error?.issues[0].message).toBe("Choose an Area");
  });
});

describe("rowId", () => {
  it("allows null (adding) and positive integers (editing)", () => {
    expect(rowId.parse(null)).toBeNull();
    expect(rowId.parse(7)).toBe(7);
  });

  it("rejects ids a tampered request could send", () => {
    for (const bad of [0, -1, 1.5, "7"]) {
      expect(rowId.safeParse(bad).success).toBe(false);
    }
  });
});

describe("designSchema", () => {
  const base = { schoolId: 1, description: "Gold crest, blue stone" };

  it("allows a Design with no year", () => {
    expect(designSchema.parse({ ...base, year: null }).year).toBeNull();
  });

  it("rejects years that can't be a class year", () => {
    for (const year of [27, 3000, 2027.5, NaN]) {
      expect(designSchema.safeParse({ ...base, year }).success).toBe(false);
    }
  });
});

describe("inviteSchema", () => {
  it("trims and lowercases the email", () => {
    expect(
      inviteSchema.parse({ email: "  Owner@Gmail.COM ", role: "member" }).email,
    ).toBe("owner@gmail.com");
  });

  it("rejects something that isn't an email", () => {
    const result = inviteSchema.safeParse({ email: "owner", role: "member" });
    expect(result.error?.issues[0].message).toBe("Enter a valid email");
  });

  it("only allows the two roles", () => {
    expect(
      inviteSchema.safeParse({ email: "a@b.co", role: "owner" }).success,
    ).toBe(false);
  });
});
