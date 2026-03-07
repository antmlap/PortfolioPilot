"use client";

import { Sparkles, TrendingUp } from "lucide-react";
import clsx from "clsx";

const POPULAR_SYMBOLS = ["AAPL", "MSFT", "GOOGL", "NVDA", "AMZN", "TSLA", "META", "JPM"];

interface HeroProps {
  onSelectSymbol: (symbol: string) => void;
  currentSymbol?: string;
  isLoading?: boolean;
}

export function Hero({ onSelectSymbol, currentSymbol, isLoading }: HeroProps) {
  return (
    <section
      className="relative overflow-hidden rounded-2xl glass border border-slate-700/50 p-8 sm:p-12"
      aria-label="Multi-agent stock advisory"
    >
      <div className="relative z-10">
        <div className="flex items-center gap-2 text-teal mb-2">
          <Sparkles className="w-5 h-5" aria-hidden />
          <span className="text-sm font-semibold uppercase tracking-wider">
            Multi-agent advisory
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight max-w-2xl mb-3">
          Get a roundtable take on any stock
        </h2>
        <p className="text-slate-400 text-lg max-w-xl mb-8">
          Warren Buffett, Peter Lynch, Ray Dalio, Benjamin Graham, and Cathie Wood debate pros and
          cons—with real-time sentiment and how often the stock beat the news.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500">Try:</span>
          {POPULAR_SYMBOLS.map((sym) => {
            const isActive = currentSymbol === sym;
            return (
              <button
                key={sym}
                type="button"
                onClick={() => onSelectSymbol(sym)}
                disabled={isLoading}
                aria-pressed={isActive}
                aria-label={`Analyze ${sym}`}
                className={clsx(
                  "px-4 py-2 rounded-lg border text-sm font-mono transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-void",
                  isActive
                    ? "bg-slate-700 border-teal/50 text-white shadow-sm shadow-teal/10"
                    : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200 hover:text-white"
                )}
              >
                {sym}
              </button>
            );
          })}
        </div>
      </div>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none" aria-hidden>
        <TrendingUp className="w-48 h-48 text-teal" strokeWidth={0.5} />
      </div>
    </section>
  );
}
