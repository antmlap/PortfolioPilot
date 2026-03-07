/**
 * Fetch real stock data from Yahoo Finance.
 * Maps to StockSentimentSummary for compatibility with existing UI.
 */

import YahooFinance from "yahoo-finance2";
import type {
  StockSentimentSummary,
  SentimentVsPerformance,
  SentimentLevel,
} from "./sentiment";

const yf = new YahooFinance();

function scoreToLevel(score: number): SentimentLevel {
  if (score <= -0.6) return "very_bearish";
  if (score <= -0.2) return "bearish";
  if (score <= 0.2) return "neutral";
  if (score <= 0.6) return "bullish";
  return "very_bullish";
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Convert price change % to sentiment score (-1 to 1). ~20% = 1, -20% = -1 */
function changePercentToSentiment(changePercent: number | undefined): number {
  if (changePercent == null) return 0;
  return Math.max(-1, Math.min(1, changePercent / 20));
}

export async function getStockDataFromYahoo(symbol: string): Promise<StockSentimentSummary> {
  const sym = symbol.toUpperCase();
  const now = new Date();
  const period2 = formatDate(now);
  const period1 = formatDate(new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000)); // ~4 months

  const [quoteResult, historyResult] = await Promise.all([
    yf.quote(sym),
    yf.historical(sym, { period1, period2, interval: "1d" }),
  ]);

  const quote = Array.isArray(quoteResult) ? quoteResult[0] : quoteResult;
  const history = Array.isArray(historyResult) ? historyResult : historyResult;

  if (!quote) {
    throw new Error(`No quote data for ${sym}`);
  }

  const price = (quote as { regularMarketPrice?: number }).regularMarketPrice;
  if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
    throw new Error(`No valid price for ${sym}`);
  }

  let changePercent = (quote as { regularMarketChangePercent?: number }).regularMarketChangePercent;
  if (changePercent == null) {
    const prevClose = (quote as { regularMarketPreviousClose?: number }).regularMarketPreviousClose ?? 0;
    const change = (quote as { regularMarketChange?: number }).regularMarketChange ?? 0;
    changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;
  }

  const currentSentiment = changePercentToSentiment(changePercent);
  const currentLevel = scoreToLevel(currentSentiment);

  const recentHeadlines = [
    {
      text: `Price $${price.toFixed(2)} (${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}% today)`,
      score: currentSentiment,
      date: formatDate(now),
    },
  ];

  const historical: SentimentVsPerformance[] = [];
  const sortedHistory = (history as { date: Date; close: number }[]).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  for (let i = 10; i < sortedHistory.length; i++) {
    const curr = sortedHistory[i];
    const prev = sortedHistory[i - 5];
    if (!prev || !curr) continue;
    const actualReturn = prev.close > 0 ? ((curr.close - prev.close) / prev.close) * 100 : 0;
    const prevSentiment = changePercentToSentiment(actualReturn / 2);
    const expectedRet = prevSentiment * 5;
    historical.push({
      date: formatDate(new Date(curr.date)),
      sentimentScore: prevSentiment,
      actualReturn,
      expectedFromSentiment: expectedRet,
      outperformed: actualReturn > expectedRet,
    });
  }

  const outperformedCount = historical.filter((h) => h.outperformed).length;
  const outperformRate =
    historical.length > 0 ? Math.round((outperformedCount / historical.length) * 100) : 50;
  const avgOutperformance =
    historical.length > 0
      ? historical.reduce((s, h) => s + (h.actualReturn - h.expectedFromSentiment), 0) /
        historical.length
      : 0;

  return {
    symbol: sym,
    currentSentiment,
    currentLevel,
    recentHeadlines,
    historical,
    outperformRate,
    avgOutperformance: Math.round(avgOutperformance * 10) / 10,
  };
}
