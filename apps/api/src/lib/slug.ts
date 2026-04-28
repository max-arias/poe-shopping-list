const ALPHABET = "abcdefghjkmnpqrstvwxyz23456789"; // 30 chars, no visual confusables
const LENGTH = 10;

export function generateSlug(): string {
  const bytes = new Uint8Array(LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}
