"use client";

import Link from "next/link";
import clsx from "clsx";
import { ChevronRight } from "lucide-react";

interface TickerRowProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

/** Compact ticker-style row: single line, minimal height. */
export function TickerRow({ href, children, className }: TickerRowProps) {
  return (
    <Link
      href={href}
      className={clsx(
        "group flex items-center gap-2 py-2 px-3 rounded-md min-h-[2.25rem] transition-colors",
        "hover:bg-ink/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset",
        className
      )}
    >
      <span className="flex-1 min-w-0 flex items-center gap-2">{children}</span>
      <ChevronRight className="w-4 h-4 text-mute group-hover:text-accent shrink-0" aria-hidden />
    </Link>
  );
}

interface MoverCardProps {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  change: number;
}

export function MoverCard({ symbol, name, price, changePercent, change }: MoverCardProps) {
  const isPositive = changePercent >= 0;
  return (
    <TickerRow href={`/?symbol=${encodeURIComponent(symbol)}`}>
      <span className="font-mono font-semibold text-ink w-12 sm:w-14 shrink-0">{symbol}</span>
      <span className="text-sm text-mute truncate min-w-0">{name}</span>
      <span className="font-mono text-sm text-ink ml-auto shrink-0">${price.toFixed(2)}</span>
      <span
        className={clsx(
          "font-mono text-sm font-medium w-14 text-right shrink-0",
          isPositive ? "text-positive" : "text-negative"
        )}
      >
        {isPositive ? "+" : ""}{changePercent.toFixed(2)}%
      </span>
    </TickerRow>
  );
}

interface EarningCardProps {
  symbol: string;
  name: string;
  date: string;
  when: "bmo" | "amc";
}

export function EarningCard({ symbol, name, date, when }: EarningCardProps) {
  const displayDate = new Date(date + "Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return (
    <TickerRow href={`/?symbol=${encodeURIComponent(symbol)}`}>
      <span className="font-mono font-semibold text-ink w-12 sm:w-14 shrink-0">{symbol}</span>
      <span className="text-sm text-mute truncate min-w-0">{name}</span>
      <span className="text-sm text-ink ml-auto shrink-0">{displayDate}</span>
      <span className="text-xs text-mute shrink-0 w-10">{when === "bmo" ? "BMO" : "AMC"}</span>
    </TickerRow>
  );
}

interface IpoCardProps {
  name: string;
  symbol: string;
  date: string;
  exchange: string;
}

export function IpoCard({ name, symbol, date, exchange }: IpoCardProps) {
  const displayDate = new Date(date + "Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return (
    <TickerRow href={`/?symbol=${encodeURIComponent(symbol)}`}>
      <span className="font-mono font-semibold text-ink w-12 sm:w-14 shrink-0">{symbol}</span>
      <span className="text-sm text-mute truncate min-w-0">{name}</span>
      <span className="text-sm text-ink ml-auto shrink-0">{displayDate}</span>
      <span className="text-xs text-mute shrink-0 w-12">{exchange}</span>
    </TickerRow>
  );
}
