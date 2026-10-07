import { randomInt } from "node:crypto";

// Codes are read over the phone and typed from paper, so no 0/O, 1/I/L.
export const ORDER_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const ORDER_CODE_LENGTH = 6;

// randomInt is cryptographically secure: codes can't be guessed from earlier ones.
export function generateOrderCode(random = randomInt): string {
  let code = "";
  for (let i = 0; i < ORDER_CODE_LENGTH; i++) {
    code += ORDER_CODE_ALPHABET[random(ORDER_CODE_ALPHABET.length)];
  }
  return code;
}
