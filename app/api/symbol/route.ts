import { NextRequest, NextResponse } from "next/server";
import { validateSymbol } from "@/lib/validation";
import {
  getSymbolInfo,
  fetchSymbolFromAlphaVantage,
} from "@/lib/symbols";

export async function GET(request: NextRequest) {
  const { valid, symbol, error: validationError } = validateSymbol(
    request.nextUrl.searchParams.get("symbol")
  );
  if (!valid) {
    return NextResponse.json(
      { valid: false, symbol: symbol || "", error: validationError },
      { status: 400 }
    );
  }

  let info = getSymbolInfo(symbol);
  if (!info && process.env.ALPHA_VANTAGE_API_KEY) {
    info = await fetchSymbolFromAlphaVantage(symbol);
  }

  if (!info) {
    return NextResponse.json({
      valid: false,
      symbol,
      error: `"${symbol}" is not a recognized stock symbol. Try one of the tickers below.`,
    });
  }

  return NextResponse.json({
    valid: true,
    symbol: info.symbol,
    name: info.name,
  });
}
