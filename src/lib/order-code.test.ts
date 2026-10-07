import { describe, expect, it } from "vitest";
import {
  ORDER_CODE_ALPHABET,
  ORDER_CODE_LENGTH,
  generateOrderCode,
} from "./order-code";

describe("generateOrderCode", () => {
  it("makes 6 characters from the alphabet", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateOrderCode();
      expect(code).toHaveLength(ORDER_CODE_LENGTH);
      for (const c of code) expect(ORDER_CODE_ALPHABET).toContain(c);
    }
  });

  it("never uses characters that look alike", () => {
    for (const c of "0O1IL") expect(ORDER_CODE_ALPHABET).not.toContain(c);
  });

  it("uses every position of the alphabet", () => {
    let n = 0;
    const counter = (max: number) => n++ % max;
    expect(generateOrderCode(counter)).toBe("ABCDEF");
    n = ORDER_CODE_ALPHABET.length - 1;
    expect(generateOrderCode(counter)[0]).toBe("9");
  });
});
