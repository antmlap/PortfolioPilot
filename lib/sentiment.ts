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
  outperformRate: number;
  avgOutperformance: number;
  /** Trailing P/E ratio */
  pe?: number | null;
  /** Forward P/E */
  forwardPE?: number | null;
  /** Market cap (USD) */
  marketCap?: number | null;
  /** Beta vs market */
  beta?: number | null;
  /** Price position in 52-week range (0–100) */
  fiftyTwoWeekPct?: number | null;
  /** 1-month price return % */
  return1M?: number | null;
  /** 1-month return vs S&P 500 (percentage points) */
  vsSpy1M?: number | null;
  /** Volume today / avg daily volume (e.g. 1.2 = 20% above avg) */
  volumeVsAvg?: number | null;
  /** Dividend yield % */
  dividendYield?: number | null;
  /** EPS trailing twelve months */
  eps?: number | null;
  /** Recent news/developments from Yahoo (headline + date) */
  newsHeadlines?: { text: string; date: string }[];
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
    pe: 20 + Math.floor(seed * 30),
    forwardPE: 18 + Math.floor(seed * 25),
    marketCap: 50e9 + seed * 500e9,
    beta: 0.8 + seed * 0.8,
    fiftyTwoWeekPct: Math.round(30 + seed * 40),
    return1M: Math.round((seed - 0.4) * 20 * 10) / 10,
    vsSpy1M: Math.round((seed - 0.5) * 10 * 10) / 10,
    volumeVsAvg: 0.8 + seed * 0.6,
    dividendYield: seed < 0.5 ? Math.round(seed * 4 * 1000) / 1000 : null,
    eps: Math.round((1 + seed * 5) * 10) / 10,
    newsHeadlines: recentHeadlines.map((h) => ({ text: h.text, date: h.date })),
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
