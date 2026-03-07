"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Headline {
  text: string;
  score: number;
  date: string;
}

interface HeadlinesFeedProps {
  headlines: Headline[];
  className?: string;
}

function SentimentIcon({ score }: { score: number }) {
  if (score > 0.2) return <TrendingUp className="w-3.5 h-3.5 text-positive" />;
  if (score < -0.2) return <TrendingDown className="w-3.5 h-3.5 text-negative" />;
  return <Minus className="w-3.5 h-3.5 text-mute" />;
}

export function HeadlinesFeed({ headlines, className }: HeadlinesFeedProps) {
  return (
    <div className={className}>
      <h3 className="text-xs font-medium text-mute uppercase tracking-wider mb-2">
        Recent news sentiment
      </h3>
      <ul className="space-y-2">
        {headlines.map((h, i) => (
          <li
            key={i}
            className="flex gap-2 items-start text-sm text-ink py-1.5 border-b border-border last:border-0"
          >
            <SentimentIcon score={h.score} />
            <span className="flex-1">{h.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
