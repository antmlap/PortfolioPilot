/**
 * Shared validation for API inputs.
 */

const SYMBOL_REGEX = /^[A-Z]{1,5}$/;

export function validateSymbol(input: string | null | undefined): {
  valid: boolean;
  symbol: string;
  error?: string;
} {
  const raw = (input ?? "").trim().toUpperCase();
  if (!raw) {
    return { valid: false, symbol: "AAPL", error: "Symbol is required" };
  }
  if (raw.length > 5) {
    return { valid: false, symbol: raw.slice(0, 5), error: "Symbol must be 1–5 characters" };
  }
  if (!SYMBOL_REGEX.test(raw)) {
    return { valid: false, symbol: raw, error: "Symbol must contain only letters" };
  }
  return { valid: true, symbol: raw };
}
