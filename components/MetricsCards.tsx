"use client";

import { BarChart3, Percent, TrendingUp } from "lucide-react";

interface MetricsCardsProps {
  /** Legacy; used when new metrics not provided */
  outperformRate?: number;
  avgOutperformance?: number;
  currentSentiment?: number;
  pe?: number | null;
  beta?: number | null;
  fiftyTwoWeekPct?: number | null;
  return1M?: number | null;
  vsSpy1M?: number | null;
  className?: string;
}

export function MetricsCards({
  outperformRate = 50,
  avgOutperformance = 0,
  currentSentiment = 0,
  pe,
  beta,
  fiftyTwoWeekPct,
  return1M,
  vsSpy1M,
  className,
}: MetricsCardsProps) {
  const useNewMetrics = pe != null || beta != null || return1M != null || vsSpy1M != null;

  const cards = useNewMetrics
    ? [
        pe != null && { label: "P/E", value: pe.toFixed(1), sub: "Trailing", icon: BarChart3, color: "text-accent" as const, bg: "bg-accent-mute" as const },
        beta != null && { label: "Beta", value: beta.toFixed(2), sub: "vs market", icon: TrendingUp, color: "text-orange" as const, bg: "bg-orange-mute" as const },
        fiftyTwoWeekPct != null && { label: "52w range", value: `${fiftyTwoWeekPct}%`, sub: "Position in range", icon: Percent, color: "text-accent" as const, bg: "bg-accent-mute" as const },
        return1M != null && { label: "1M return", value: `${return1M > 0 ? "+" : ""}${return1M}%`, sub: "Price return", icon: TrendingUp, color: return1M >= 0 ? "text-positive" : "text-negative", bg: return1M >= 0 ? "bg-green-50" : "bg-red-50" },
        vsSpy1M != null && { label: "vs S&P 500", value: `${vsSpy1M > 0 ? "+" : ""}${vsSpy1M}%`, sub: "1M relative", icon: BarChart3, color: vsSpy1M >= 0 ? "text-positive" : "text-negative", bg: vsSpy1M >= 0 ? "bg-green-50" : "bg-red-50" },
      ].filter(Boolean) as { label: string; value: string; sub: string; icon: typeof BarChart3; color: string; bg: string }[]
    : [
        { label: "Outperform rate", value: `${outperformRate}%`, sub: "of periods beat sentiment", icon: Percent, color: "text-accent", bg: "bg-accent-mute" },
        { label: "Avg outperformance", value: `${avgOutperformance > 0 ? "+" : ""}${avgOutperformance}%`, sub: "vs sentiment-implied return", icon: BarChart3, color: avgOutperformance >= 0 ? "text-positive" : "text-negative", bg: avgOutperformance >= 0 ? "bg-green-50" : "bg-red-50" },
        { label: "Current sentiment", value: currentSentiment.toFixed(2), sub: "score (-1 to +1)", icon: TrendingUp, color: "text-orange", bg: "bg-orange-mute" },
      ];

  return (
    <div className={className} role="region" aria-label="Stock metrics">
      <div className={`grid gap-4 ${cards.length === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5"}`}>
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-lg border-2 border-orange bg-orange-mute p-4 flex flex-col gap-1"
            aria-label={`${c.label}: ${c.value}`}
          >
            <div
              className={`inline-flex w-9 h-9 rounded-md items-center justify-center ${c.bg} ${c.color}`}
            >
              <c.icon className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase tracking-wider text-mute font-medium">
              {c.label}
            </span>
            <span className={`font-mono text-lg font-semibold ${c.color}`}>
              {c.value}
            </span>
            <span className="text-xs text-mute">{c.sub}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
