import { randomBytes } from "node:crypto";

// Excludes ambiguous chars (0/O, 1/I/L)
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateAccessCode(): string {
  const bytes = randomBytes(12);
  let code = "";
  for (let i = 0; i < 12; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
    if (i === 3 || i === 7) code += "-";
  }
  return code;
}
