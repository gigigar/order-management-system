import { describe, expect, it } from "vitest";
import { formatPesos, toCentavos, toPesos } from "./money";

describe("toCentavos", () => {
  it("converts pesos to whole centavos", () => {
    expect(toCentavos(4500)).toBe(450000);
    expect(toCentavos(0.5)).toBe(50);
  });

  it("isn't thrown off by floating-point error", () => {
    expect(toCentavos(19.99)).toBe(1999);
    expect(toCentavos(0.29)).toBe(29);
  });
});

describe("toPesos", () => {
  it("round-trips with toCentavos", () => {
    expect(toPesos(toCentavos(1234.56))).toBe(1234.56);
  });
});

describe("formatPesos", () => {
  it("shows the peso sign and two decimals", () => {
    expect(formatPesos(450000)).toBe("₱4,500.00");
  });
});
