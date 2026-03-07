import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 1) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const { default: YahooFinance } = await import("yahoo-finance2");
    const yf = new YahooFinance();
    const result = await yf.search(q, { quotesCount: 15, enableFuzzyQuery: true });
    const quotes = (result?.quotes ?? []) as Array<{ symbol?: string; longname?: string; shortname?: string }>;

    const suggestions = quotes
      .filter((item) => item.symbol && String(item.symbol).length <= 10)
      .slice(0, 12)
      .map((item) => ({
        symbol: String(item.symbol).toUpperCase(),
        name: item.longname || item.shortname || item.symbol,
      }));

    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error("Symbol search error:", err);
    return NextResponse.json({ suggestions: [] }, { status: 200 });
  }
}
