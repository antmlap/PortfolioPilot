"use client";

import { useState, useEffect, useCallback } from "react";
import { AppHeader } from "@/components/AppHeader";
import { BrowseSection } from "@/components/BrowseSection";
import { MoverCard, EarningCard, IpoCard } from "@/components/BrowseCard";
import { BrowseSkeleton } from "@/components/LoadingSkeletons";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Rocket,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import clsx from "clsx";
import { apiUrl } from "@/lib/api";

interface BrowseMover {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  change: number;
}

interface BrowseEarning {
  symbol: string;
  name: string;
  date: string;
  when: "bmo" | "amc";
}

interface BrowseIpo {
  name: string;
  symbol: string;
  date: string;
  exchange: string;
}

interface BrowseData {
  upcomingEarnings: BrowseEarning[];
  upcomingIpos: BrowseIpo[];
  topGainers: BrowseMover[];
  topLosers: BrowseMover[];
}

function formatLastUpdated(ms: number): string {
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return "Just now";
  const min = Math.floor(sec / 60);
  if (min === 1) return "1 min ago";
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  return hr === 1 ? "1 hr ago" : `${hr} hr ago`;
}

export default function BrowsePage() {
  const [data, setData] = useState<BrowseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl("/api/browse"));
      if (!res.ok) throw new Error("Failed to load browse data");
      const json: BrowseData = await res.json();
      setData(json);
      setLastUpdated(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const [lastUpdatedLabel, setLastUpdatedLabel] = useState("");
  useEffect(() => {
    if (lastUpdated == null) return;
    const update = () => setLastUpdatedLabel(formatLastUpdated(Date.now() - lastUpdated));
    update();
    const t = setInterval(update, 60_000);
    return () => clearInterval(t);
  }, [lastUpdated]);

  if (error && !data) {
    return (
      <>
        <AppHeader />
        <main id="main" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="rounded-lg border border-border bg-surface/50 p-6 flex flex-col items-center gap-4">
            <AlertCircle className="w-10 h-10 text-orange" aria-hidden />
            <p className="text-sm text-ink font-medium">{error}</p>
            <button
              type="button"
              onClick={() => fetchData()}
              className="px-3 py-1.5 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              Try again
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <main id="main" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <header className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="font-display text-xl font-semibold text-ink tracking-tight">
              Browse
            </h1>
            <p className="text-xs text-mute mt-0.5">
              Tap any symbol to analyze with advisors.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated != null && (
              <span className="text-xs text-mute tabular-nums">
                {lastUpdatedLabel}
              </span>
            )}
            <button
              type="button"
              onClick={() => fetchData(true)}
              disabled={loading || refreshing}
              aria-label="Refresh"
              className={clsx(
                "p-1.5 rounded-md border border-border bg-paper text-mute transition-colors",
                "hover:bg-surface hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
                (loading || refreshing) && "opacity-60 cursor-not-allowed"
              )}
            >
              <RefreshCw
                className={clsx("w-4 h-4", refreshing && "animate-spin")}
                aria-hidden
              />
            </button>
          </div>
        </header>

        {loading && !data ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <BrowseSection
                key={i}
                title="Loading"
                icon={TrendingUp}
              >
                <BrowseSkeleton />
              </BrowseSection>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <BrowseSection title="Gainers" icon={TrendingUp}>
              {data?.topGainers.length ? (
                <ul className="divide-y divide-border/60" role="list">
                  {data.topGainers.map((m) => (
                    <li key={m.symbol}>
                      <MoverCard
                        symbol={m.symbol}
                        name={m.name}
                        price={m.price}
                        changePercent={m.changePercent}
                        change={m.change}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-mute py-4 px-3 text-center">No data</p>
              )}
            </BrowseSection>

            <BrowseSection title="Losers" icon={TrendingDown}>
              {data?.topLosers.length ? (
                <ul className="divide-y divide-border/60" role="list">
                  {data.topLosers.map((m) => (
                    <li key={m.symbol}>
                      <MoverCard
                        symbol={m.symbol}
                        name={m.name}
                        price={m.price}
                        changePercent={m.changePercent}
                        change={m.change}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-mute py-4 px-3 text-center">No data</p>
              )}
            </BrowseSection>

            <BrowseSection title="Earnings" icon={Calendar}>
              {data?.upcomingEarnings.length ? (
                <ul className="divide-y divide-border/60" role="list">
                  {data.upcomingEarnings.map((e) => (
                    <li key={`${e.symbol}-${e.date}`}>
                      <EarningCard
                        symbol={e.symbol}
                        name={e.name}
                        date={e.date}
                        when={e.when}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-mute py-4 px-3 text-center">No data</p>
              )}
            </BrowseSection>

            <BrowseSection title="IPOs" icon={Rocket}>
              {data?.upcomingIpos.length ? (
                <ul className="divide-y divide-border/60" role="list">
                  {data.upcomingIpos.map((ipo) => (
                    <li key={`${ipo.symbol}-${ipo.date}`}>
                      <IpoCard
                        name={ipo.name}
                        symbol={ipo.symbol}
                        date={ipo.date}
                        exchange={ipo.exchange}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-mute py-4 px-3 text-center">No data</p>
              )}
            </BrowseSection>
          </div>
        )}

        {refreshing && data && (
          <div className="fixed bottom-3 right-3 flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-ink text-paper text-xs shadow-lg">
            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
            Updating…
          </div>
        )}
      </main>
    </>
  );
}
