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
      color: "text-teal",
      bg: "bg-teal/10",
    },
    {
      label: "Avg outperformance",
      value: `${avgOutperformance > 0 ? "+" : ""}${avgOutperformance}%`,
      sub: "vs sentiment-implied return",
      icon: BarChart3,
      color: avgOutperformance >= 0 ? "text-mint" : "text-coral",
      bg: avgOutperformance >= 0 ? "bg-mint/10" : "bg-coral/10",
    },
    {
      label: "Current sentiment",
      value: currentSentiment.toFixed(2),
      sub: "score (-1 to +1)",
      icon: TrendingUp,
      color: "text-gold",
      bg: "bg-gold/10",
    },
  ];

  return (
    <div className={className}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="glass rounded-xl p-4 flex flex-col gap-1"
          >
            <div className={`inline-flex w-8 h-8 rounded-lg items-center justify-center ${c.bg} ${c.color}`}>
              <c.icon className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase tracking-wider text-slate-500">{c.label}</span>
            <span className={`font-mono text-lg font-semibold ${c.color}`}>{c.value}</span>
            <span className="text-xs text-slate-500">{c.sub}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
