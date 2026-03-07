"use client";

import { Sparkles, TrendingUp } from "lucide-react";

const POPULAR_SYMBOLS = ["AAPL", "MSFT", "GOOGL", "NVDA", "AMZN", "TSLA", "META", "JPM"];

interface HeroProps {
  onSelectSymbol: (symbol: string) => void;
  isLoading?: boolean;
}

export function Hero({ onSelectSymbol, isLoading }: HeroProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl glass border border-slate-700/50 p-8 sm:p-12">
      <div className="relative z-10">
        <div className="flex items-center gap-2 text-teal mb-2">
          <Sparkles className="w-5 h-5" />
          <span className="text-sm font-semibold uppercase tracking-wider">Multi-agent advisory</span>
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
          {POPULAR_SYMBOLS.map((sym) => (
            <button
              key={sym}
              type="button"
              onClick={() => onSelectSymbol(sym)}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-mono text-slate-200 hover:text-white transition-colors disabled:opacity-50"
            >
              {sym}
            </button>
          ))}
        </div>
      </div>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
        <TrendingUp className="w-48 h-48 text-teal" strokeWidth={0.5} />
      </div>
    </section>
  );
}
