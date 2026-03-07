/**
 * Sentiment and historical performance comparison.
 * For hackathon: mock data + structure for real API (News API, Alpha Vantage, etc.)
 */

export type SentimentLevel = "very_bearish" | "bearish" | "neutral" | "bullish" | "very_bullish";

export interface SentimentSnapshot {
  date: string;
  score: number; // -1 to 1
  level: SentimentLevel;
  headline?: string;
}

export interface PerformanceSnapshot {
  date: string;
  price: number;
  return1d: number;  // 1-day return %
  return5d: number;
  return20d: number;
}

export interface SentimentVsPerformance {
  date: string;
  sentimentScore: number;
  actualReturn: number;  // e.g. 5d return
  expectedFromSentiment: number; // simplified: e.g. sentiment * 5
  outperformed: boolean;
}

export interface StockSentimentSummary {
  symbol: string;
  currentSentiment: number;
  currentLevel: SentimentLevel;
  recentHeadlines: { text: string; score: number; date: string }[];
  historical: SentimentVsPerformance[];
  outperformRate: number; // 0-100, % of periods where stock outperformed sentiment
  avgOutperformance: number; // avg (actualReturn - expectedFromSentiment)
}

const LEVELS: SentimentLevel[] = ["very_bearish", "bearish", "neutral", "bullish", "very_bullish"];

function scoreToLevel(score: number): SentimentLevel {
  if (score <= -0.6) return "very_bearish";
  if (score <= -0.2) return "bearish";
  if (score <= 0.2) return "neutral";
  if (score <= 0.6) return "bullish";
  return "very_bullish";
}

/** Simple deterministic hash so the same symbol gets the same sentiment in a session. */
function hashSymbol(symbol: string): number {
  let h = 0;
  for (let i = 0; i < symbol.length; i++) {
    h = (h * 31 + symbol.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Generate mock sentiment + performance for demo. Replace with real API in production. */
export function getMockStockSentiment(symbol: string): StockSentimentSummary {
  const now = new Date();
  const seed = (hashSymbol(symbol) % 100) / 100;
  const timeSeed = (now.getHours() * 60 + now.getMinutes()) / (24 * 60);
  const combined = (seed * 0.7 + timeSeed * 0.3);
  const currentScore = -0.75 + combined * 1.5;
  const clamp = (x: number) => Math.max(-1, Math.min(1, x));
  const recentHeadlines = [
    { text: `${symbol} beats earnings estimates amid strong demand`, score: clamp(currentScore + 0.1), date: formatDate(now) },
    { text: `Analysts raise price targets on ${symbol}`, score: clamp(currentScore + 0.2), date: formatDate(now) },
    { text: `Sector headwinds could pressure ${symbol} margins`, score: clamp(currentScore - 0.3), date: formatDate(now) },
  ];
  const historical: SentimentVsPerformance[] = [];
  for (let i = 90; i >= 0; i -= 10) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const sent = -0.5 + Math.random();
    const actualRet = (Math.random() - 0.4) * 15;
    const expectedRet = sent * 8;
    historical.push({
      date: formatDate(d),
      sentimentScore: sent,
      actualReturn: actualRet,
      expectedFromSentiment: expectedRet,
      outperformed: actualRet > expectedRet,
    });
  }
  const outperformedCount = historical.filter((h) => h.outperformed).length;
  const outperformRate = Math.round((outperformedCount / historical.length) * 100);
  const avgOutperformance =
    historical.reduce((s, h) => s + (h.actualReturn - h.expectedFromSentiment), 0) / historical.length;

  return {
    symbol,
    currentSentiment: Math.round(currentScore * 100) / 100,
    currentLevel: scoreToLevel(currentScore),
    recentHeadlines,
    historical,
    outperformRate,
    avgOutperformance: Math.round(avgOutperformance * 10) / 10,
  };
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function getSentimentLabel(level: SentimentLevel): string {
  const labels: Record<SentimentLevel, string> = {
    very_bearish: "Very Bearish",
    bearish: "Bearish",
    neutral: "Neutral",
    bullish: "Bullish",
    very_bullish: "Very Bullish",
  };
  return labels[level];
}
