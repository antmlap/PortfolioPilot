import { NextRequest, NextResponse } from "next/server";
import { getStockSentiment, getStockSentimentStrict } from "@/lib/sentiment-api";
import { validateSymbol } from "@/lib/validation";

const BLOCKED_SYMBOLS = new Set(["FUCK", "SHIT", "ASS", "FJUCK"]);

export async function GET(request: NextRequest) {
  const raw = (request.nextUrl.searchParams.get("symbol") ?? "").trim().toUpperCase();
  const strict = request.nextUrl.searchParams.get("strict") === "true";

  const { valid, symbol, error } = validateSymbol(raw || undefined);

  if (strict) {
    if (!valid) {
      return NextResponse.json(
        { error: error ?? "Enter a stock symbol." },
        { status: 400 }
      );
    }
    if (BLOCKED_SYMBOLS.has(symbol)) {
      return NextResponse.json(
        { error: "Symbol not found or invalid" },
        { status: 404 }
      );
    }
    try {
      const summary = await getStockSentimentStrict(symbol);
      return NextResponse.json(summary);
    } catch {
      return NextResponse.json(
        { error: "Symbol not found or invalid" },
        { status: 404 }
      );
    }
  }

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
