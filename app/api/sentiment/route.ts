import { NextRequest, NextResponse } from "next/server";
import { getMockStockSentiment } from "@/lib/sentiment";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol")?.toUpperCase() || "AAPL";
  const summary = getMockStockSentiment(symbol);
  return NextResponse.json(summary);
}
