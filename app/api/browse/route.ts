import { NextResponse } from "next/server";
import { getSymbolInfo } from "@/lib/symbols";

/** Symbols to fetch for biggest movers (subset for reasonable API time). */
const MOVER_SYMBOLS = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "JPM", "V", "JNJ",
  "WMT", "PG", "MA", "HD", "DIS", "BAC", "XOM", "ADBE", "CRM", "NFLX",
  "COST", "PEP", "KO", "AVGO", "ACN", "CSCO", "INTC", "AMD", "QCOM", "TXN",
];

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

export async function GET() {
  try {
    const { default: YahooFinance } = await import("yahoo-finance2");
    const yf = new YahooFinance();

    const quotes = await Promise.allSettled(
      MOVER_SYMBOLS.map((sym) => yf.quote(sym))
    );

    const movers: BrowseMover[] = [];
    for (let i = 0; i < MOVER_SYMBOLS.length; i++) {
      const result = quotes[i];
      if (result.status !== "fulfilled" || !result.value) continue;
      const q = Array.isArray(result.value) ? result.value[0] : result.value;
      const sym = MOVER_SYMBOLS[i];
      const price = (q as { regularMarketPrice?: number }).regularMarketPrice;
      const change = (q as { regularMarketChange?: number }).regularMarketChange ?? 0;
      const changePercent = (q as { regularMarketChangePercent?: number }).regularMarketChangePercent;
      const prevClose = (q as { regularMarketPreviousClose?: number }).regularMarketPreviousClose;
      const pct = changePercent ?? (prevClose ? (change / prevClose) * 100 : 0);
      if (typeof price === "number" && Number.isFinite(price)) {
        const info = getSymbolInfo(sym);
        movers.push({
          symbol: sym,
          name: info?.name ?? sym,
          price: Math.round(price * 100) / 100,
          changePercent: Math.round(pct * 100) / 100,
          change: Math.round(change * 100) / 100,
        });
      }
    }

    movers.sort((a, b) => b.changePercent - a.changePercent);
    const topGainers = movers.filter((m) => m.changePercent > 0).slice(0, 10);
    const topLosers = movers.filter((m) => m.changePercent < 0).slice(0, 10);

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
