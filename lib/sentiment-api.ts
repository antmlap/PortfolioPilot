/**
 * Server-only: fetches real stock data from Yahoo Finance with mock fallback.
 * Import only from API routes to avoid bundling yahoo-finance2 in the client.
 */

import type { StockSentimentSummary } from "./sentiment";
import { getMockStockSentiment } from "./sentiment";

const CACHE_TTL_MS = 60_000; // 1 minute
const sentimentCache = new Map<
  string,
  { data: StockSentimentSummary; expiry: number }
>();

export async function getStockSentiment(symbol: string): Promise<StockSentimentSummary> {
  const key = symbol.toUpperCase();
  const cached = sentimentCache.get(key);
  if (cached && cached.expiry > Date.now()) return cached.data;

  try {
    const { getStockDataFromYahoo } = await import("./yahoo-stock");
    const data = await getStockDataFromYahoo(symbol);
    sentimentCache.set(key, { data, expiry: Date.now() + CACHE_TTL_MS });
    return data;
  } catch {
    const data = getMockStockSentiment(symbol);
    sentimentCache.set(key, { data, expiry: Date.now() + CACHE_TTL_MS });
    return data;
  }
}

/** Fetches real data only. Throws if symbol is invalid or fetch fails. Use for validating before adding to portfolio. */
export async function getStockSentimentStrict(symbol: string): Promise<StockSentimentSummary> {
  const { getStockDataFromYahoo } = await import("./yahoo-stock");
  return await getStockDataFromYahoo(symbol);
}
