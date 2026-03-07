"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { DiscussionThread } from "@/components/DiscussionThread";
import { SentimentGauge } from "@/components/SentimentGauge";
import { SentimentChart } from "@/components/SentimentChart";
import { HeadlinesFeed } from "@/components/HeadlinesFeed";
import { MetricsCards } from "@/components/MetricsCards";
import { StockChart } from "@/components/StockChart";
import { Hero } from "@/components/Hero";
import { SelectAdvisors } from "@/components/SelectAdvisors";
import { MetricsSkeleton, DiscussionSkeleton, SidebarSkeleton } from "@/components/LoadingSkeletons";
import { ErrorState } from "@/components/ErrorState";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ADVISORS, ADVISOR_IDS, type AdvisorId, type CustomAdvisor, type AdvisorForDiscussion } from "@/lib/advisors";
import { apiUrl } from "@/lib/api";
import type { DiscussionMessage } from "@/lib/discussion";
import type { StockSentimentSummary } from "@/lib/sentiment";

const DEFAULT_SYMBOL = "AAPL";

function HomeContent() {
  const searchParams = useSearchParams();
  const symbolFromUrl = searchParams.get("symbol")?.trim().toUpperCase();
  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [inputSymbol, setInputSymbol] = useState(DEFAULT_SYMBOL);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [sentiment, setSentiment] = useState<StockSentimentSummary | null>(null);
  const [discussion, setDiscussion] = useState<DiscussionMessage[]>([]);
  const [selectedAdvisorIds, setSelectedAdvisorIds] = useState<AdvisorId[]>(() => [...ADVISOR_IDS]);
  const [customAdvisors, setCustomAdvisors] = useState<CustomAdvisor[]>([]);
  const [instructionOverrides, setInstructionOverrides] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [discussing, setDiscussing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getErrorFromRes = async (res: Response, fallback: string) => {
    try {
      const data = await res.json();
      return (data?.error as string) || fallback;
    } catch {
      return fallback;
    }
  };

  const buildAdvisorsForDiscussion = useCallback((): AdvisorForDiscussion[] => {
    const list: AdvisorForDiscussion[] = [];
    for (const id of selectedAdvisorIds) {
      const a = ADVISORS[id];
      if (a) {
        list.push({
          id: a.id,
          name: a.name,
          title: a.title,
          instructions: instructionOverrides[a.id] ?? a.instructions,
        });
      }
    }
    for (const c of customAdvisors) {
      list.push({
        id: c.id,
        name: c.name,
        title: c.title,
        instructions: c.instructions,
      });
    }
    return list;
  }, [selectedAdvisorIds, customAdvisors, instructionOverrides]);

  const fetchData = useCallback(async (sym: string) => {
    setLoading(true);
    setError(null);
    const advisorsForDiscussion = buildAdvisorsForDiscussion();
    const usePost = customAdvisors.length > 0 || Object.keys(instructionOverrides).length > 0;
    try {
      const [sentRes, discRes] = await Promise.all([
        fetch(apiUrl(`/api/sentiment?symbol=${encodeURIComponent(sym)}`)),
        usePost && advisorsForDiscussion.length > 0
          ? fetch(apiUrl("/api/discussion"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ symbol: sym, advisors: advisorsForDiscussion }),
            })
          : fetch(
              apiUrl(
                `/api/discussion?symbol=${encodeURIComponent(sym)}${
                  selectedAdvisorIds.length > 0
                    ? `&advisors=${encodeURIComponent(selectedAdvisorIds.join(","))}`
                    : ""
                }`
              )
            ),
      ]);
      if (!sentRes.ok) {
        throw new Error(
          await getErrorFromRes(sentRes, "Failed to load sentiment")
        );
      }
      if (!discRes.ok) {
        throw new Error(
          await getErrorFromRes(discRes, "Failed to load discussion")
        );
      }
      const [sentJson, discJson] = await Promise.all([
        sentRes.json(),
        discRes.json(),
      ]);
      setSentiment(sentJson);
      setDiscussion([]);
      setDiscussing(true);
      for (let i = 0; i < discJson.messages.length; i++) {
        await new Promise((r) => setTimeout(r, 600));
        setDiscussion((prev) => [...prev, discJson.messages[i]]);
      }
      setDiscussing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setSentiment(null);
      setDiscussion([]);
      setDiscussing(false);
    } finally {
      setLoading(false);
    }
  }, [buildAdvisorsForDiscussion, customAdvisors, instructionOverrides, selectedAdvisorIds]);

  useEffect(() => {
    if (symbolFromUrl && symbolFromUrl.length <= 6) {
      setSymbol(symbolFromUrl);
      setInputSymbol(symbolFromUrl);
    }
  }, [symbolFromUrl]);

  useEffect(() => {
    fetchData(symbol);
  }, [symbol, fetchData]);

  useEffect(() => {
    let cancelled = false;
    fetch(apiUrl(`/api/symbol?symbol=${encodeURIComponent(symbol)}`))
      .then((r) => r.json())
      .then((data: { valid?: boolean; name?: string }) => {
        if (!cancelled && data.valid && data.name) setCompanyName(data.name);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const s = inputSymbol.trim().toUpperCase();
    if (!s) return;
    setError(null);
    try {
      const res = await fetch(apiUrl(`/api/symbol?symbol=${encodeURIComponent(s)}`));
      const data = (await res.json()) as {
        valid?: boolean;
        symbol?: string;
        name?: string;
        error?: string;
      };
      if (!data.valid) {
        setError(data.error ?? `"${s}" is not a recognized stock symbol.`);
        return;
      }
      setSymbol(data.symbol ?? s);
      setCompanyName(data.name ?? null);
      setInputSymbol(data.symbol ?? s);
      setError(null);
    } catch {
      setError("Could not verify symbol. Please try again.");
    }
  };

  const handleSelectSymbol = (s: string) => {
    setInputSymbol(s);
    setSymbol(s);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-paper">
        <header
          className="border-b border-border bg-paper/95 backdrop-blur-sm sticky top-0 z-10"
          role="banner"
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <a
                href="/"
                className="flex items-center gap-3 hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper rounded"
                aria-label="Portfolio Pilot home"
              >
                <img
                  src="/logo.png"
                  alt=""
                  className="h-9 w-auto object-contain [mix-blend-mode:darken]"
                  width={36}
                  height={36}
                />
                <span className="font-display text-xl font-semibold text-ink tracking-tight">
                  Portfolio Pilot
                </span>
                <span className="text-mute text-sm hidden sm:inline">
                  Stock advisory
                </span>
              </a>
              <div className="flex items-center gap-3">
                <a
                  href="/browse"
                  className="text-sm font-medium text-mute hover:text-accent transition-colors whitespace-nowrap"
                >
                  Browse
                </a>
                <a
                  href="/portfolio"
                  className="text-sm font-medium text-mute hover:text-accent transition-colors whitespace-nowrap"
                >
                  My Portfolio
                </a>
                <a
                  href="/settings"
                  className="text-sm font-medium text-mute hover:text-accent transition-colors whitespace-nowrap"
                >
                  Settings
                </a>
                <a
                  href="/login"
                  className="text-sm font-medium text-mute hover:text-accent transition-colors whitespace-nowrap"
                >
                  Log in
                </a>
                <form
                onSubmit={handleSearch}
                className="flex gap-2"
                role="search"
                aria-label="Search by ticker"
              >
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mute pointer-events-none"
                    aria-hidden
                  />
                  <input
                    type="text"
                    value={inputSymbol}
                    onChange={(e) =>
                      setInputSymbol(e.target.value.toUpperCase())
                    }
                    placeholder="Symbol (e.g. AAPL)"
                    maxLength={6}
                    autoComplete="off"
                    aria-label="Stock ticker symbol"
                    className="w-32 sm:w-40 pl-9 pr-3 py-2 rounded-md bg-surface border border-border text-sm font-mono text-ink placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  aria-busy={loading}
                  aria-label={loading ? "Analyzing…" : "Analyze stock"}
                  className="px-4 py-2 rounded-md bg-accent text-white font-medium text-sm hover:bg-accent-hover transition-colors disabled:opacity-50 flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                  ) : (
                    "Analyze"
                  )}
                </button>
              </form>
              </div>
            </div>
          </div>
        </header>

        <main
          id="main"
          className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8"
        >
          <Hero
            onSelectSymbol={handleSelectSymbol}
            currentSymbol={symbol}
            isLoading={loading}
          />

          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-mono text-2xl font-semibold text-ink">
              {symbol}
            </span>
            {companyName && (
              <span
                className="text-mute text-lg"
                aria-label={`Company: ${companyName}`}
              >
                — {companyName}
              </span>
            )}
            {discussing && (
              <span className="text-sm text-accent flex items-center gap-1 w-full sm:w-auto">
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                Advisors discussing…
              </span>
            )}
          </div>

          <section className="rounded-lg border-2 border-orange bg-orange-mute p-4 sm:p-6">
            <StockChart symbol={symbol} />
          </section>

          {error && (
            <ErrorState message={error} onRetry={() => fetchData(symbol)} />
          )}

          {!error && loading && <MetricsSkeleton />}
          {!error && sentiment && (
            <MetricsCards
              outperformRate={sentiment.outperformRate}
              avgOutperformance={sentiment.avgOutperformance}
              currentSentiment={sentiment.currentSentiment}
            />
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-8">
              <section className="rounded-lg border-2 border-orange bg-orange-mute p-6">
                <h2 className="text-xs font-medium text-mute uppercase tracking-wider mb-4">
                  Advisor discussion — pros & cons
                </h2>
                {error ? null : loading ? (
                  <DiscussionSkeleton />
                ) : discussion.length > 0 ? (
                  <DiscussionThread messages={discussion} customAdvisors={customAdvisors} />
                ) : (
                  <p className="text-mute text-sm py-8 text-center">
                    Enter a symbol and click Analyze, or pick a ticker above to
                    start the discussion.
                  </p>
                )}
              </section>
            </div>

            <div className="space-y-6">
              {loading && <SidebarSkeleton />}
              {!loading && !sentiment && !error && (
                <div className="rounded-lg border-2 border-orange bg-orange-mute p-8 text-center text-mute text-sm">
                  Analyze a stock to see real-time sentiment, headlines, and
                  sentiment vs performance.
                </div>
              )}
              {!loading && sentiment && (
                <>
                  <section className="rounded-lg border-2 border-orange bg-orange-mute p-6">
                    <h2 className="text-xs font-medium text-mute uppercase tracking-wider mb-4">
                      Real-time sentiment
                    </h2>
                    <SentimentGauge
                      score={sentiment.currentSentiment}
                      level={sentiment.currentLevel}
                      label="News sentiment"
                    />
                  </section>
                  <section className="rounded-lg border-2 border-orange bg-orange-mute p-6">
                    <HeadlinesFeed headlines={sentiment.recentHeadlines} />
                  </section>
                  <section className="rounded-lg border-2 border-orange bg-orange-mute p-6">
                    <h2 className="text-xs font-medium text-mute uppercase tracking-wider mb-4">
                      Sentiment vs performance
                    </h2>
                    <SentimentChart data={sentiment.historical} />
                  </section>
                </>
              )}
            </div>
          </div>

          <SelectAdvisors
            selectedIds={selectedAdvisorIds}
            customAdvisors={customAdvisors}
            instructionOverrides={instructionOverrides}
            onSelectionChange={setSelectedAdvisorIds}
            onCustomAdvisorsChange={setCustomAdvisors}
            onInstructionOverride={(id, instructions) =>
              setInstructionOverrides((prev) =>
                instructions == null
                  ? (() => {
                      const next = { ...prev };
                      delete next[id];
                      return next;
                    })()
                  : { ...prev, [id]: instructions }
              )
            }
          />
        </main>

        <footer
          className="border-t border-border mt-16 py-8 bg-paper"
          role="contentinfo"
        >
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <span className="font-display text-sm font-medium text-ink">
                Portfolio Pilot
              </span>
              <nav
                className="flex flex-wrap gap-6 text-sm text-mute"
                aria-label="Footer"
              >
                <a href="#main" className="hover:text-ink transition-colors">
                  Top
                </a>
                <a
                  href="#select-advisors"
                  className="hover:text-ink transition-colors"
                >
                  Select advisors
                </a>
              </nav>
            </div>
            <p className="mt-4 text-xs text-mute">
              For educational and informational use. Connect News API and market
              data APIs for live sentiment and prices.
            </p>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}

function HomeFallback() {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-accent animate-spin" aria-hidden />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomeContent />
    </Suspense>
  );
}
