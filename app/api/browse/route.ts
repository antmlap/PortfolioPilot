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

/** Map Yahoo screener quote to BrowseMover. */
function screenerQuoteToMover(q: {
  symbol: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
}): BrowseMover {
  return {
    symbol: q.symbol,
    name: q.longName ?? q.shortName ?? q.symbol,
    price: Math.round(q.regularMarketPrice * 100) / 100,
    changePercent: Math.round(q.regularMarketChangePercent * 100) / 100,
    change: Math.round(q.regularMarketChange * 100) / 100,
  };
}

export async function GET() {
  try {
    const { default: YahooFinance } = await import("yahoo-finance2");
    const yf = new YahooFinance();

    const [gainersRes, losersRes] = await Promise.all([
      yf.screener({ scrIds: "day_gainers", count: 10 }),
      yf.screener({ scrIds: "day_losers", count: 10 }),
    ]);

    const topGainers: BrowseMover[] = (gainersRes?.quotes ?? []).slice(0, 10).map((q: { symbol: string; shortName?: string; longName?: string; regularMarketPrice: number; regularMarketChange: number; regularMarketChangePercent: number }) =>
      screenerQuoteToMover(q)
    );
    const topLosers: BrowseMover[] = (losersRes?.quotes ?? []).slice(0, 10).map((q: { symbol: string; shortName?: string; longName?: string; regularMarketPrice: number; regularMarketChange: number; regularMarketChangePercent: number }) =>
      screenerQuoteToMover(q)
    );

    const data: BrowseData = {
      upcomingEarnings: getMockEarnings(),
      upcomingIpos: getMockIpos(),
      topGainers,
      topLosers,
    };

    return NextResponse.json(data);
  } catch (err) {
    console.error("Browse API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load browse data" },
      { status: 500 }
    );
  }
}
