"use client";

import { getSentimentLabel, type SentimentLevel } from "@/lib/sentiment";
import clsx from "clsx";

interface SentimentGaugeProps {
  score: number; // -1 to 1
  level: SentimentLevel;
  label?: string;
  className?: string;
}

const levelColors: Record<SentimentLevel, string> = {
  very_bearish: "bg-red-500",
  bearish: "bg-orange-500",
  neutral: "bg-slate-500",
  bullish: "bg-teal",
  very_bullish: "bg-emerald-400",
};

const levelTextColors: Record<SentimentLevel, string> = {
  very_bearish: "text-red-400",
  bearish: "text-orange-400",
  neutral: "text-slate-400",
  bullish: "text-teal",
  very_bullish: "text-emerald-400",
};

export function SentimentGauge({ score, level, label = "Sentiment", className }: SentimentGaugeProps) {
  const pct = Math.round(((score + 1) / 2) * 100);
  return (
    <div className={clsx("space-y-1", className)}>
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className={clsx("font-mono font-medium", levelTextColors[level])}>
          {getSentimentLabel(level)}
        </span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={clsx("h-full rounded-full transition-all duration-500", levelColors[level])}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
        <span>-1</span>
        <span>{score.toFixed(2)}</span>
        <span>+1</span>
      </div>
    </div>
  );
}
