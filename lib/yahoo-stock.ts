/**
 * Fetch real stock data from Yahoo Finance.
 * Uses P/E, Beta, 52-week range, 1M return, vs S&P 500, volume, and news (insights).
 */

import YahooFinance from "yahoo-finance2";
import type { StockSentimentSummary, SentimentLevel, SentimentVsPerformance } from "./sentiment";

const yf = new YahooFinance();

const SPY_SYMBOL = "^GSPC";

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

/** Normalize a value to -1..1 using a scale (e.g. ±20 for 1-day %, ±15 for 1M %). */
function normalizeToSentiment(value: number, scale: number): number {
  return Math.max(-1, Math.min(1, value / scale));
}

/** Composite momentum score: 0.25× 1-day + 0.45× 1M + 0.3× 52w position, clamped to -1..1. */
function compositeMomentumScore(
  dayChangePercent: number,
  return1MPercent: number | null,
  fiftyTwoWeekPct: number | null
): number {
  const dayNorm = normalizeToSentiment(dayChangePercent, 20);
  const monthNorm = return1MPercent != null ? normalizeToSentiment(return1MPercent, 15) : 0;
  const fiftyTwoNorm =
    fiftyTwoWeekPct != null ? Math.max(-1, Math.min(1, (fiftyTwoWeekPct - 50) / 50)) : 0;
  const raw = 0.25 * dayNorm + 0.45 * monthNorm + 0.3 * fiftyTwoNorm;
  return Math.round(Math.max(-1, Math.min(1, raw)) * 100) / 100;
}

/** Compute 1-month return from sorted daily closes (approx 21 trading days) */
function return1MFromHistory(
  sortedHistory: { date: Date; close: number }[]
): number | null {
  if (sortedHistory.length < 2) return null;
  const recent = sortedHistory[sortedHistory.length - 1];
  const monthAgoIdx = Math.max(0, sortedHistory.length - 22);
  const monthAgo = sortedHistory[monthAgoIdx];
  if (!monthAgo || monthAgo.close <= 0) return null;
  return ((recent.close - monthAgo.close) / monthAgo.close) * 100;
}

const HISTORICAL_SENTIMENT_SCALE = 15; // same as 1M % for composite

/** Build sentiment vs performance series from price history. Uses trailing 1M return as sentiment proxy and forward 1M return as actual. */
function buildHistoricalFromPriceHistory(
  sortedHistory: { date: Date; close: number }[]
): SentimentVsPerformance[] {
  const out: SentimentVsPerformance[] = [];
  const step = 5; // sample every ~5 trading days
  for (let i = 22; i < sortedHistory.length - 22; i += step) {
    const cur = sortedHistory[i];
    const past = sortedHistory[i - 21];
    const future = sortedHistory[i + 21];
    if (!cur?.close || !past?.close || !future?.close || past.close <= 0 || cur.close <= 0) continue;
    const trailingReturn1M = ((cur.close - past.close) / past.close) * 100;
    const sentimentScore = Math.max(-1, Math.min(1, trailingReturn1M / HISTORICAL_SENTIMENT_SCALE));
    const actualReturn = ((future.close - cur.close) / cur.close) * 100;
    const expectedFromSentiment = sentimentScore * 8;
    out.push({
      date: formatDate(new Date(cur.date)),
      sentimentScore: Math.round(sentimentScore * 100) / 100,
      actualReturn: Math.round(actualReturn * 10) / 10,
      expectedFromSentiment: Math.round(expectedFromSentiment * 10) / 10,
      outperformed: actualReturn > expectedFromSentiment,
    });
  }
  return out;
}

export async function getStockDataFromYahoo(symbol: string): Promise<StockSentimentSummary> {
  const sym = symbol.toUpperCase();
  const now = new Date();
  const period2 = formatDate(now);
  const period1 = formatDate(new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000)); // ~4 months

  const [quoteResult, historyResult, spyHistoryResult, insightsResult, searchResult] = await Promise.all([
    yf.quote(sym),
    yf.historical(sym, { period1, period2, interval: "1d" }),
    yf.historical(SPY_SYMBOL, { period1, period2, interval: "1d" }),
    yf.insights(sym).catch(() => null),
    yf.search(sym, { newsCount: 15, quotesCount: 1 }).catch(() => null),
  ]);

  const quote = Array.isArray(quoteResult) ? quoteResult[0] : quoteResult;
  const history = Array.isArray(historyResult) ? historyResult : historyResult;
  const spyHistory = Array.isArray(spyHistoryResult) ? spyHistoryResult : spyHistoryResult;
  const insights = insightsResult;
  const search = searchResult as {
    news?: { title: string; publisher: string; providerPublishTime?: number | Date }[];
  } | null;

  if (!quote) {
    throw new Error(`No quote data for ${sym}`);
  }

  const q = quote as Record<string, unknown>;
  const price = q.regularMarketPrice as number;
  if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
    throw new Error(`No valid price for ${sym}`);
  }

  const pe = typeof q.trailingPE === "number" && Number.isFinite(q.trailingPE) ? q.trailingPE : null;
  const forwardPE = typeof q.forwardPE === "number" && Number.isFinite(q.forwardPE) ? q.forwardPE : null;
  const marketCap = typeof q.marketCap === "number" && Number.isFinite(q.marketCap) ? q.marketCap : null;
  const beta = typeof q.beta === "number" && Number.isFinite(q.beta) ? q.beta : null;
  const fiftyTwoWeekHigh = typeof q.fiftyTwoWeekHigh === "number" && Number.isFinite(q.fiftyTwoWeekHigh) ? q.fiftyTwoWeekHigh : null;
  const fiftyTwoWeekLow = typeof q.fiftyTwoWeekLow === "number" && Number.isFinite(q.fiftyTwoWeekLow) ? q.fiftyTwoWeekLow : null;
  const regularMarketVolume = typeof q.regularMarketVolume === "number" ? q.regularMarketVolume : null;
  const averageDailyVolume3Month = typeof q.averageDailyVolume3Month === "number" ? q.averageDailyVolume3Month : null;
  const dividendYield = typeof q.trailingAnnualDividendYield === "number" ? q.trailingAnnualDividendYield : (q.dividendYield as number | undefined) ?? null;
  const eps = typeof q.epsTrailingTwelveMonths === "number" && Number.isFinite(q.epsTrailingTwelveMonths) ? q.epsTrailingTwelveMonths : null;

  let fiftyTwoWeekPct: number | null = null;
  if (fiftyTwoWeekHigh != null && fiftyTwoWeekLow != null && fiftyTwoWeekHigh > fiftyTwoWeekLow) {
    fiftyTwoWeekPct = Math.round(((price - fiftyTwoWeekLow) / (fiftyTwoWeekHigh - fiftyTwoWeekLow)) * 100);
    fiftyTwoWeekPct = Math.max(0, Math.min(100, fiftyTwoWeekPct));
  }

  const volumeVsAvg =
    regularMarketVolume != null && averageDailyVolume3Month != null && averageDailyVolume3Month > 0
      ? Math.round((regularMarketVolume / averageDailyVolume3Month) * 100) / 100
      : null;

  const sortedHistory = (history as { date: Date; close: number }[]).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const return1M = return1MFromHistory(sortedHistory);

  let vsSpy1M: number | null = null;
  const sortedSpy = (spyHistory as { date: Date; close: number }[]).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const spyReturn1M = return1MFromHistory(sortedSpy);
  if (return1M != null && spyReturn1M != null) {
    vsSpy1M = Math.round((return1M - spyReturn1M) * 10) / 10;
  }

  const newsHeadlines: { text: string; date: string }[] = [];
  if (search?.news && Array.isArray(search.news) && search.news.length > 0) {
    for (const n of search.news.slice(0, 15)) {
      if (n?.title) {
        const publisher = n.publisher ? ` (${n.publisher})` : "";
        const dateStr =
          n.providerPublishTime != null
            ? (n.providerPublishTime instanceof Date
                ? n.providerPublishTime
                : new Date(
                    typeof n.providerPublishTime === "number" && n.providerPublishTime < 1e12
                      ? n.providerPublishTime * 1000
                      : (n.providerPublishTime as number)
                  )
              ).toISOString().slice(0, 10)
            : formatDate(now);
        newsHeadlines.push({ text: `${n.title}${publisher}`, date: dateStr });
      }
    }
  }
  if (newsHeadlines.length === 0 && insights && Array.isArray((insights as { sigDevs?: { headline: string; date: Date }[] }).sigDevs)) {
    const sigDevs = (insights as { sigDevs: { headline: string; date: Date }[] }).sigDevs;
    for (let i = 0; i < Math.min(5, sigDevs.length); i++) {
      const dev = sigDevs[i];
      if (dev?.headline) {
        newsHeadlines.push({
          text: dev.headline,
          date: dev.date ? new Date(dev.date).toISOString().slice(0, 10) : "",
        });
      }
    }
  }

  const currentSentiment = compositeMomentumScore(
    Number(q.regularMarketChangePercent ?? 0),
    return1M,
    fiftyTwoWeekPct
  );
  const currentLevel = scoreToLevel(currentSentiment);

  const historical = buildHistoricalFromPriceHistory(sortedHistory);
  const outperformedCount = historical.filter((h) => h.outperformed).length;
  const outperformRate = historical.length > 0 ? Math.round((outperformedCount / historical.length) * 100) : 50;
  const avgOutperformance =
    historical.length > 0
      ? historical.reduce((s, h) => s + (h.actualReturn - h.expectedFromSentiment), 0) / historical.length
      : 0;

  const priceChange = (q.regularMarketChangePercent as number) ?? 0;
  const recentHeadlines =
    newsHeadlines.length > 0
      ? newsHeadlines.map((n) => ({ text: n.text, score: 0 as number, date: n.date }))
      : [
          {
            text: `Price $${price.toFixed(2)} (${priceChange >= 0 ? "+" : ""}${Number(priceChange).toFixed(2)}% today)`,
            score: currentSentiment,
            date: formatDate(now),
          },
        ];

  return {
    symbol: sym,
    currentSentiment,
    currentLevel,
    recentHeadlines,
    historical,
    outperformRate,
    avgOutperformance: Math.round(avgOutperformance * 10) / 10,
    pe,
    forwardPE,
    marketCap,
    beta,
    fiftyTwoWeekPct,
    return1M: return1M != null ? Math.round(return1M * 10) / 10 : null,
    vsSpy1M,
    volumeVsAvg,
    dividendYield: dividendYield != null ? Math.round(dividendYield * 1000) / 1000 : null,
    eps,
    price: Math.round(price * 100) / 100,
    newsHeadlines: newsHeadlines.length > 0 ? newsHeadlines : undefined,
  };
}
