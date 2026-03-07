"use client";

import { BarChart3, Percent, TrendingUp } from "lucide-react";

interface MetricsCardsProps {
  outperformRate: number;
  avgOutperformance: number;
  currentSentiment: number;
  className?: string;
}

export function MetricsCards({
  outperformRate,
  avgOutperformance,
  currentSentiment,
  className,
}: MetricsCardsProps) {
  const cards = [
    {
      label: "Outperform rate",
      value: `${outperformRate}%`,
      sub: "of periods beat sentiment",
      icon: Percent,
      color: "text-accent",
      bg: "bg-accent-mute",
    },
    {
      label: "Avg outperformance",
      value: `${avgOutperformance > 0 ? "+" : ""}${avgOutperformance}%`,
      sub: "vs sentiment-implied return",
      icon: BarChart3,
      color: avgOutperformance >= 0 ? "text-positive" : "text-negative",
      bg: avgOutperformance >= 0 ? "bg-green-50" : "bg-red-50",
    },
    {
      label: "Current sentiment",
      value: currentSentiment.toFixed(2),
      sub: "score (-1 to +1)",
      icon: TrendingUp,
      color: "text-orange",
      bg: "bg-orange-mute",
    },
  ];

  return (
    <div className={className} role="region" aria-label="Stock metrics">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
