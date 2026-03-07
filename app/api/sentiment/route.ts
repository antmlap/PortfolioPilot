import { NextRequest, NextResponse } from "next/server";
import { getStockSentiment, getStockSentimentStrict } from "@/lib/sentiment-api";
import { validateSymbol } from "@/lib/validation";

/** Valid US-style ticker: 1-5 letters, optional .A/.B etc. No spaces or junk. */
const VALID_SYMBOL = /^[A-Z]{1,5}(\.[A-Z])?$/;

const BLOCKED_SYMBOLS = new Set([
  "FUCK", "SHIT", "ASS", "FJUCK", "FJUCK MEE", "AOSDOSAK",
]);

export async function GET(request: NextRequest) {
  const raw = (request.nextUrl.searchParams.get("symbol") ?? "").trim().toUpperCase();
  const strict = request.nextUrl.searchParams.get("strict") === "true";

  if (strict) {
    if (!raw) {
      return NextResponse.json(
        { error: "Enter a stock symbol." },
        { status: 400 }
      );
    }
    if (!VALID_SYMBOL.test(raw)) {
      return NextResponse.json(
        { error: "Invalid symbol. Use 1–5 letters, e.g. AAPL or BRK.A" },
        { status: 400 }
      );
    }
    if (BLOCKED_SYMBOLS.has(raw)) {
      return NextResponse.json(
        { error: "Symbol not found or invalid" },
        { status: 404 }
      );
    }
    try {
      const summary = await getStockSentimentStrict(raw);
      return NextResponse.json(summary);
    } catch {
      return NextResponse.json(
        { error: "Symbol not found or invalid" },
        { status: 404 }
      );
    }
  }

  const { valid, symbol, error } = validateSymbol(raw || undefined);
  if (!valid) {
    return NextResponse.json(
      { error: error ?? "Invalid symbol" },
      { status: 400 }
    );
  }
  try {
    const summary = await getStockSentiment(symbol);
    return NextResponse.json(summary);
  } catch (err) {
    console.error("Sentiment API error:", err);
    return NextResponse.json(
      { error: "Failed to load sentiment data" },
      { status: 500 }
    );
  }
}
