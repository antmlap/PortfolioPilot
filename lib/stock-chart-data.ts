/**
 * Mock stock price data for the chart. Deterministic per symbol for demo.
 * Replace with real API (e.g. Alpha Vantage, Yahoo Finance) in production.
 */

export type TimeframeKey = "1D" | "5D" | "1M" | "3M" | "1Y";

export interface StockPricePoint {
  date: string;
  price: number;
  label: string;
}

function hashSymbol(symbol: string): number {
  let h = 0;
  const s = symbol.toUpperCase();
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Pseudo-random but deterministic from seed */
function seeded(seed: number): () => number {
  return () => {
    seed = (seed * 1103515245 + 12345) >>> 0;
    return seed / 2 ** 32;
  };
}

function formatLabel(key: TimeframeKey, i: number, total: number): string {
  if (key === "1D") return `${i}:00`;
  if (key === "5D" || key === "1M") return `${i}`;
  return `Day ${i}`;
}

export function getMockStockPrices(
  symbol: string,
  timeframe: TimeframeKey
): StockPricePoint[] {
  const seed = hashSymbol(symbol);
  const rng = seeded(seed);
  const now = new Date();
  const points: StockPricePoint[] = [];

  let count: number;
  let basePrice: number;
  let intervalMs: number;

  switch (timeframe) {
    case "1D":
      count = 24;
      basePrice = 100 + (rng() * 200);
      intervalMs = 60 * 60 * 1000;
      break;
    case "5D":
      count = 5;
      basePrice = 100 + (rng() * 200);
      intervalMs = 24 * 60 * 60 * 1000;
      break;
    case "1M":
      count = 22;
      basePrice = 100 + (rng() * 200);
      intervalMs = 24 * 60 * 60 * 1000;
      break;
    case "3M":
      count = 66;
      basePrice = 100 + (rng() * 200);
      intervalMs = 24 * 60 * 60 * 1000;
      break;
    case "1Y":
      count = 52;
      basePrice = 80 + (rng() * 100);
      intervalMs = 7 * 24 * 60 * 60 * 1000;
      break;
    default:
      count = 22;
      basePrice = 100;
      intervalMs = 24 * 60 * 60 * 1000;
  }

  let price = basePrice;
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getTime() - (count - 1 - i) * intervalMs);
    const change = (rng() - 0.48) * 4;
    price = Math.max(1, price + change);
    points.push({
      date: d.toISOString(),
      price: Math.round(price * 100) / 100,
      label: formatLabel(timeframe, timeframe === "1D" ? i : i + 1, count),
    });
  }

  return points;
}
