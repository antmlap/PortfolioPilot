/**
 * Server-only: fetches real stock data from Yahoo Finance with mock fallback.
 * Import only from API routes to avoid bundling yahoo-finance2 in the client.
 */

import type { StockSentimentSummary } from "./sentiment";
import { getMockStockSentiment } from "./sentiment";

export async function getStockSentiment(symbol: string): Promise<StockSentimentSummary> {
  try {
    const { getStockDataFromYahoo } = await import("./yahoo-stock");
    return await getStockDataFromYahoo(symbol);
  } catch {
    return getMockStockSentiment(symbol);
  }
}

/** Fetches real data only. Throws if symbol is invalid or fetch fails. Use for validating before adding to portfolio. */
export async function getStockSentimentStrict(symbol: string): Promise<StockSentimentSummary> {
  const { getStockDataFromYahoo } = await import("./yahoo-stock");
  return await getStockDataFromYahoo(symbol);
}
