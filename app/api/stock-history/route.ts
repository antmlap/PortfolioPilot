import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import type { StockHistoryPoint, TimeframeKey } from "@/lib/stock-history";

function getDateRange(timeframe: TimeframeKey): { period1: Date; period2: Date; interval: "1d" | "1h" | "5m" } {
  const now = new Date();
  const period2 = new Date(now);
  let period1: Date;
  let interval: "1d" | "1h" | "5m" = "1d";

  switch (timeframe) {
    case "1D":
      period1 = new Date(now);
      period1.setDate(period1.getDate() - 1);
      interval = "1h";
      break;
    case "5D":
      period1 = new Date(now);
      period1.setDate(period1.getDate() - 5);
      break;
    case "1M":
      period1 = new Date(now);
      period1.setMonth(period1.getMonth() - 1);
      break;
    case "3M":
      period1 = new Date(now);
      period1.setMonth(period1.getMonth() - 3);
      break;
    case "1Y":
      period1 = new Date(now);
      period1.setFullYear(period1.getFullYear() - 1);
      break;
    default:
      period1 = new Date(now);
      period1.setMonth(period1.getMonth() - 1);
  }

  return { period1, period2, interval };
}

function formatDateLabel(date: Date, timeframe: TimeframeKey): string {
  if (timeframe === "1D") {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: false });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: timeframe === "1Y" ? "2-digit" : undefined });
}

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol")?.trim().toUpperCase();
  const timeframe = (request.nextUrl.searchParams.get("timeframe") ?? "1M") as TimeframeKey;

  const validTimeframes: TimeframeKey[] = ["1D", "5D", "1M", "3M", "1Y"];
  if (!symbol) {
    return NextResponse.json({ error: "Missing symbol" }, { status: 400 });
  }
  if (!validTimeframes.includes(timeframe)) {
    return NextResponse.json({ error: "Invalid timeframe" }, { status: 400 });
  }

  try {
    const yahooFinance = new YahooFinance();
    const { period1, period2, interval } = getDateRange(timeframe);

    const result = await yahooFinance.chart(symbol, {
      period1,
      period2,
      interval,
    });

    const quotes = result?.quotes ?? [];
    const data: StockHistoryPoint[] = quotes
      .filter((q): q is typeof q & { close: number } => q.close != null && !Number.isNaN(q.close))
      .map((q) => ({
        date: q.date.toISOString(),
        price: Math.round(q.close * 100) / 100,
        label: formatDateLabel(q.date, timeframe),
      }));

    return NextResponse.json({ symbol, timeframe, data });
  } catch (err) {
    console.error("Stock history API error:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch stock history";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
