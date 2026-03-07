/**
 * Shared validation for API inputs.
 * Allows 1-5 letters or tickers like BRK.B (letters, optional dot, letter).
 */

const SYMBOL_REGEX = /^[A-Z]{1,5}(\.[A-Z])?$/;

export function validateSymbol(input: string | null | undefined): {
  valid: boolean;
  symbol: string;
  error?: string;
} {
  const raw = (input ?? "").trim().toUpperCase();
  if (!raw) {
    return { valid: false, symbol: "AAPL", error: "Symbol is required" };
  }
  if (raw.length > 6) {
    return { valid: false, symbol: raw.slice(0, 6), error: "Symbol too long" };
  }
  if (!SYMBOL_REGEX.test(raw)) {
    return { valid: false, symbol: raw, error: "Use 1–5 letters or format like BRK.B" };
  }
  return { valid: true, symbol: raw };
}
