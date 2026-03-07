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
  if (score > 0.2) return <TrendingUp className="w-3.5 h-3.5 text-teal" />;
  if (score < -0.2) return <TrendingDown className="w-3.5 h-3.5 text-coral" />;
  return <Minus className="w-3.5 h-3.5 text-slate-500" />;
}

export function HeadlinesFeed({ headlines, className }: HeadlinesFeedProps) {
  return (
    <div className={className}>
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
        Recent news sentiment
      </h3>
      <ul className="space-y-2">
        {headlines.map((h, i) => (
          <li
            key={i}
            className="flex gap-2 items-start text-sm text-slate-300 py-1.5 border-b border-slate-800/80 last:border-0"
          >
            <SentimentIcon score={h.score} />
            <span className="flex-1">{h.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
