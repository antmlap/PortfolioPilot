import { NextRequest, NextResponse } from "next/server";
import { getMockStockSentiment } from "@/lib/sentiment";
import { validateSymbol } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const { valid, symbol, error } = validateSymbol(
    request.nextUrl.searchParams.get("symbol")
  );
  if (!valid) {
    return NextResponse.json(
      { error: error ?? "Invalid symbol" },
      { status: 400 }
    );
  }
  try {
    const summary = getMockStockSentiment(symbol);
    return NextResponse.json(summary);
  } catch (err) {
    console.error("Sentiment API error:", err);
    return NextResponse.json(
      { error: "Failed to load sentiment data" },
      { status: 500 }
    );
  }
}
