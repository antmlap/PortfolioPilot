"use client";

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
      className="rounded-lg border-2 border-orange bg-orange-mute p-8 sm:p-10"
      aria-label="Stock lookup"
    >
      <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink tracking-tight max-w-xl mb-2">
        Roundtable take on any stock
      </h2>
      <p className="text-mute text-base max-w-xl mb-6">
        Five investors—Buffett, Lynch, Dalio, Graham, Wood—weigh pros and cons
        with real-time sentiment and outperform metrics.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-mute">Try:</span>
        {POPULAR_SYMBOLS.map((sym) => {
          const isActive = currentSymbol === sym;
          return (
            <button
              key={sym}
              type="button"
              onClick={() => onSelectSymbol(sym)}
              aria-pressed={isActive}
              aria-label={isActive ? `Selected: ${sym}` : `Select ${sym}`}
              className={clsx(
                "px-3.5 py-1.5 rounded-md border-2 text-sm font-mono transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-orange-mute cursor-pointer",
                isActive
                  ? "bg-accent border-accent text-white font-medium"
                  : "bg-white border-accent text-accent hover:bg-accent-mute"
              )}
            >
              {sym}
            </button>
          );
        })}
      </div>
    </section>
  );
}
