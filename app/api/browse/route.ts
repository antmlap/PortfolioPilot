import { NextResponse } from "next/server";

export interface BrowseEarning {
  symbol: string;
  name: string;
  date: string;
  when: "bmo" | "amc";
}

export interface BrowseIpo {
  name: string;
  symbol: string;
  date: string;
  exchange: string;
}

export interface BrowseMover {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  change: number;
}

export interface BrowseData {
  upcomingEarnings: BrowseEarning[];
  upcomingIpos: BrowseIpo[];
  topGainers: BrowseMover[];
  topLosers: BrowseMover[];
}

/** Mock upcoming earnings (replace with real calendar API when available). */
function getMockEarnings(): BrowseEarning[] {
  const now = new Date();
  const names: [string, string][] = [
    ["NKE", "Nike Inc."],
    ["MU", "Micron Technology Inc."],
    ["FDX", "FedEx Corporation"],
    ["ORCL", "Oracle Corporation"],
    ["WMT", "Walmart Inc."],
    ["COST", "Costco Wholesale Corporation"],
    ["SBUX", "Starbucks Corporation"],
    ["ADBE", "Adobe Inc."],
  ];
  return names.map(([symbol, name], i) => {
    const d = new Date(now);
    d.setDate(d.getDate() + 3 + i * 2);
    return {
      symbol,
      name,
      date: d.toISOString().slice(0, 10),
      when: (i % 2 === 0 ? "bmo" : "amc") as "bmo" | "amc",
    };
  }).slice(0, 8);
}

/** Mock upcoming IPOs (replace with real IPO calendar when available). */
function getMockIpos(): BrowseIpo[] {
  const now = new Date();
  const items: [string, string, string][] = [
    ["Reddit Inc.", "RDDT", "NYSE"],
    ["Astera Labs Inc.", "ALAB", "NASDAQ"],
    ["KKR & Co. Inc.", "KKR", "NYSE"],
    ["Rubrik Inc.", "RBRK", "NYSE"],
    ["Tempus AI Inc.", "TEM", "NASDAQ"],
  ];
  return items.map(([name, symbol, exchange], i) => {
    const d = new Date(now);
    d.setDate(d.getDate() + 7 + i * 5);
    return { name, symbol, date: d.toISOString().slice(0, 10), exchange };
  });
}

/** Mock movers when Yahoo screener fails (e.g. rate limit or validation). */
function getMockMovers(): { topGainers: BrowseMover[]; topLosers: BrowseMover[] } {
  const gainers: [string, string, number, number][] = [
    ["NVDA", "NVIDIA Corporation", 128.5, 4.2],
    ["AAPL", "Apple Inc.", 228.1, 2.1],
    ["META", "Meta Platforms Inc.", 518.0, 3.5],
    ["GOOGL", "Alphabet Inc.", 168.2, 1.8],
    ["AMZN", "Amazon.com Inc.", 198.0, 2.4],
  ];
  const losers: [string, string, number, number][] = [
    ["XYZ", "Example Corp", 12.4, -5.1],
    ["ABC", "Sample Inc", 8.2, -3.7],
  ];
  return {
    topGainers: gainers.map(([symbol, name, price, pct]) => ({
      symbol,
      name,
      price,
      changePercent: pct,
      change: Math.round(price * (pct / 100) * 100) / 100,
    })),
    topLosers: losers.map(([symbol, name, price, pct]) => ({
      symbol,
      name,
      price,
      changePercent: pct,
      change: Math.round(price * (pct / 100) * 100) / 100,
    })),
  };
}

/** Map Yahoo screener quote to BrowseMover. Handles optional/raw fields. */
function screenerQuoteToMover(q: Record<string, unknown>): BrowseMover | null {
  const price = Number((q.regularMarketPrice as number) ?? (q as { regularMarketPrice?: { raw?: number } }).regularMarketPrice?.raw ?? 0);
  const change = Number((q.regularMarketChange as number) ?? (q as { regularMarketChange?: { raw?: number } }).regularMarketChange?.raw ?? 0);
  const changePct = Number((q.regularMarketChangePercent as number) ?? (q as { regularMarketChangePercent?: { raw?: number } }).regularMarketChangePercent?.raw ?? 0);
  const symbol = String(q.symbol ?? "");
  if (!symbol || Number.isNaN(price)) return null;
  return {
    symbol,
    name: String(q.longName ?? q.shortName ?? symbol),
    price: Math.round(price * 100) / 100,
    changePercent: Math.round(changePct * 100) / 100,
    change: Math.round(change * 100) / 100,
  };
}

export async function GET() {
  const baseData: Omit<BrowseData, "topGainers" | "topLosers"> = {
    upcomingEarnings: getMockEarnings(),
    upcomingIpos: getMockIpos(),
  };

  try {
    const { default: YahooFinance } = await import("yahoo-finance2");
    const yf = new YahooFinance();

    const [gainersRes, losersRes] = await Promise.all([
      yf.screener({ scrIds: "day_gainers", count: 10 }),
      yf.screener({ scrIds: "day_losers", count: 10 }),
    ]);

    const topGainers: BrowseMover[] = (gainersRes?.quotes ?? [])
      .slice(0, 10)
      .map((q) => screenerQuoteToMover(q as unknown as Record<string, unknown>))
      .filter((m): m is BrowseMover => m != null);
    const topLosers: BrowseMover[] = (losersRes?.quotes ?? [])
      .slice(0, 10)
      .map((q) => screenerQuoteToMover(q as unknown as Record<string, unknown>))
      .filter((m): m is BrowseMover => m != null);

    return NextResponse.json({
      ...baseData,
      topGainers: topGainers.length > 0 ? topGainers : getMockMovers().topGainers,
      topLosers: topLosers.length > 0 ? topLosers : getMockMovers().topLosers,
    });
  } catch (err) {
    console.error("Browse API error:", err);
    const { topGainers, topLosers } = getMockMovers();
    return NextResponse.json({
      ...baseData,
      topGainers,
      topLosers,
    });
  }
}
