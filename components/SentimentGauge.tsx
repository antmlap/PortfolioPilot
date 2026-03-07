"use client";

import { getSentimentLabel, type SentimentLevel } from "@/lib/sentiment";
import clsx from "clsx";

interface SentimentGaugeProps {
  score: number;
  level: SentimentLevel;
  label?: string;
  className?: string;
}

const levelColors: Record<SentimentLevel, string> = {
  very_bearish: "bg-red-500",
  bearish: "bg-orange-500",
  neutral: "bg-neutral",
  bullish: "bg-accent",
  very_bullish: "bg-positive",
};

const levelTextColors: Record<SentimentLevel, string> = {
  very_bearish: "text-negative",
  bearish: "text-orange-600",
  neutral: "text-neutral",
  bullish: "text-accent",
  very_bullish: "text-positive",
};

export function SentimentGauge({
  score,
  level,
  label = "Sentiment",
  className,
}: SentimentGaugeProps) {
  const pct = Math.round(((score + 1) / 2) * 100);
  return (
    <div className={clsx("space-y-1", className)}>
      <div className="flex justify-between text-xs">
        <span className="text-mute">{label}</span>
        <span
          className={clsx(
            "font-mono font-medium",
            levelTextColors[level]
          )}
        >
          {getSentimentLabel(level)}
        </span>
      </div>
      <div className="h-2 bg-border rounded-full overflow-hidden">
        <div
          className={clsx(
            "h-full rounded-full transition-all duration-500",
            levelColors[level]
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-mute font-mono">
        <span>-1</span>
        <span>{score.toFixed(2)}</span>
        <span>+1</span>
      </div>
    </div>
  );
}
