/**
 * Stock symbol validation and company name lookup.
 * Uses a static list of known tickers; optional Alpha Vantage API for more coverage.
 */

export interface SymbolInfo {
  symbol: string;
  name: string;
}

/** Common US stock symbols with company names (uppercase keys). */
const KNOWN_SYMBOLS: Record<string, string> = {
  AAPL: "Apple Inc.",
  MSFT: "Microsoft Corporation",
  GOOGL: "Alphabet Inc. (Google)",
  GOOG: "Alphabet Inc. (Google) Class C",
  AMZN: "Amazon.com Inc.",
  NVDA: "NVIDIA Corporation",
  META: "Meta Platforms Inc.",
  TSLA: "Tesla Inc.",
  "BRK.B": "Berkshire Hathaway Inc. Class B",
  BRKB: "Berkshire Hathaway Inc. Class B",
  JPM: "JPMorgan Chase & Co.",
  JNJ: "Johnson & Johnson",
  V: "Visa Inc.",
  PG: "Procter & Gamble Co.",
  UNH: "UnitedHealth Group Inc.",
  MA: "Mastercard Inc.",
  HD: "The Home Depot Inc.",
  DIS: "The Walt Disney Company",
  PYPL: "PayPal Holdings Inc.",
  BAC: "Bank of America Corp",
  XOM: "Exxon Mobil Corporation",
  CVX: "Chevron Corporation",
  ABBV: "AbbVie Inc.",
  WMT: "Walmart Inc.",
  MRK: "Merck & Co. Inc.",
  KO: "The Coca-Cola Company",
  PEP: "PepsiCo Inc.",
  COST: "Costco Wholesale Corporation",
  AVGO: "Broadcom Inc.",
  MCD: "McDonald's Corporation",
  CSCO: "Cisco Systems Inc.",
  ABT: "Abbott Laboratories",
  TMO: "Thermo Fisher Scientific Inc.",
  DHR: "Danaher Corporation",
  NEE: "NextEra Energy Inc.",
  ACN: "Accenture plc",
  NKE: "Nike Inc.",
  VZ: "Verizon Communications Inc.",
  T: "AT&T Inc.",
  PM: "Philip Morris International Inc.",
  INTC: "Intel Corporation",
  AMD: "Advanced Micro Devices Inc.",
  CRM: "Salesforce Inc.",
  ORCL: "Oracle Corporation",
  ADBE: "Adobe Inc.",
  NFLX: "Netflix Inc.",
  CMCSA: "Comcast Corporation",
  TXN: "Texas Instruments Inc.",
  QCOM: "QUALCOMM Inc.",
  IBM: "International Business Machines Corp",
  GE: "General Electric Company",
  BA: "The Boeing Company",
  HON: "Honeywell International Inc.",
  UPS: "United Parcel Service Inc.",
  LMT: "Lockheed Martin Corporation",
  RTX: "RTX Corporation",
  SPGI: "S&P Global Inc.",
  AMGN: "Amgen Inc.",
  GILD: "Gilead Sciences Inc.",
  GME: "GameStop Corp.",
  AMC: "AMC Entertainment Holdings Inc.",
  PLTR: "Palantir Technologies Inc.",
  SNOW: "Snowflake Inc.",
  SHOP: "Shopify Inc.",
  SQ: "Block Inc.",
  COIN: "Coinbase Global Inc.",
  HOOD: "Robinhood Markets Inc.",
  RIVN: "Rivian Automotive Inc.",
  LCID: "Lucid Group Inc.",
  NIO: "NIO Inc.",
  BABA: "Alibaba Group Holding Ltd",
  TSM: "Taiwan Semiconductor Manufacturing",
  ASML: "ASML Holding N.V.",
  PANW: "Palo Alto Networks Inc.",
  CRWD: "CrowdStrike Holdings Inc.",
  NOW: "ServiceNow Inc.",
  INTU: "Intuit Inc.",
  MU: "Micron Technology Inc.",
  LRCX: "Lam Research Corporation",
  KLAC: "KLA Corporation",
  MDLZ: "Mondelez International Inc.",
  SBUX: "Starbucks Corporation",
  CAT: "Caterpillar Inc.",
  DE: "Deere & Company",
  GS: "The Goldman Sachs Group Inc.",
  MS: "Morgan Stanley",
  SPY: "SPDR S&P 500 ETF Trust",
  QQQ: "Invesco QQQ Trust",
};

function normalizeSymbol(s: string): string {
  return s.trim().toUpperCase();
}

/**
 * Look up symbol in the static list. Returns company name if found.
 */
export function getSymbolInfo(symbol: string): SymbolInfo | null {
  const sym = normalizeSymbol(symbol);
  const name = KNOWN_SYMBOLS[sym];
  if (name) return { symbol: sym, name };
  return null;
}

/**
 * Check if the symbol is in our known list (no API call).
 */
export function isKnownSymbol(symbol: string): boolean {
  return getSymbolInfo(symbol) !== null;
}

/**
 * Fetch company name from Alpha Vantage OVERVIEW if API key is set.
 * Returns null if key not set or request fails.
 */
export async function fetchSymbolFromAlphaVantage(symbol: string): Promise<SymbolInfo | null> {
  const key = process.env.ALPHA_VANTAGE_API_KEY;
  if (!key) return null;
  const sym = normalizeSymbol(symbol);
  try {
    const res = await fetch(
      `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${encodeURIComponent(sym)}&apikey=${key}`
    );
    const data = (await res.json()) as { Name?: string; Symbol?: string };
    if (data?.Name && data?.Symbol) {
      return { symbol: data.Symbol.toUpperCase(), name: data.Name };
    }
    return null;
  } catch {
    return null;
  }
}
