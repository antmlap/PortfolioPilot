"use client";

import { Suspense, useState, useEffect, useCallback, useRef, useMemo } from "react";
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
import { useTheme } from "@/components/ThemeProvider";
import { ADVISORS, ADVISOR_IDS, type AdvisorId, type CustomAdvisor, type AdvisorForDiscussion } from "@/lib/advisors";
import { apiUrl } from "@/lib/api";
import { SYMBOL_SUGGESTIONS_LIST } from "@/lib/symbols";
import type { DiscussionMessage } from "@/lib/discussion";
import type { StockSentimentSummary } from "@/lib/sentiment";

const DEFAULT_SYMBOL = "AAPL";

function HomeContent() {
  const { userName } = useTheme();
  const searchParams = useSearchParams();
  const symbolFromUrl = searchParams.get("symbol")?.trim().toUpperCase();
  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [inputSymbol, setInputSymbol] = useState(DEFAULT_SYMBOL);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [sentiment, setSentiment] = useState<StockSentimentSummary | null>(null);
  const [discussion, setDiscussion] = useState<DiscussionMessage[]>([]);
  const [selectedAdvisorIds, setSelectedAdvisorIds] = useState<AdvisorId[]>(() => [
    "buffett",
    "lynch",
    "dalio",
    "graham",
    "wood",
  ]);
  const [customAdvisors, setCustomAdvisors] = useState<CustomAdvisor[]>([]);
  const [instructionOverrides, setInstructionOverrides] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [discussing, setDiscussing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchIdRef = useRef(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [yahooSuggestions, setYahooSuggestions] = useState<{ symbol: string; name: string }[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchQueryRef = useRef<string>("");

  const staticSuggestions = useMemo(() => {
    const q = inputSymbol.trim().toUpperCase();
    if (!q) return SYMBOL_SUGGESTIONS_LIST.slice(0, 10);
    return SYMBOL_SUGGESTIONS_LIST.filter(
      (s) =>
        s.symbol.startsWith(q) ||
        s.symbol.includes(q) ||
        s.name.toUpperCase().includes(q)
    ).slice(0, 10);
  }, [inputSymbol]);

  const suggestions = useMemo(() => {
    const q = inputSymbol.trim();
    if (q.length >= 2 && yahooSuggestions.length > 0) return yahooSuggestions;
    return staticSuggestions;
  }, [inputSymbol, yahooSuggestions, staticSuggestions]);

  useEffect(() => {
    const q = inputSymbol.trim();
    if (q.length < 2) {
      setYahooSuggestions([]);
      setSuggestionsLoading(false);
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = null;
      }
      return;
    }
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setSuggestionsLoading(true);
    searchDebounceRef.current = setTimeout(async () => {
      searchDebounceRef.current = null;
      searchQueryRef.current = q;
      try {
        const res = await fetch(apiUrl(`/api/symbol-search?q=${encodeURIComponent(q)}`));
        const data = (await res.json()) as { suggestions?: { symbol: string; name: string }[] };
        if (searchQueryRef.current === q && Array.isArray(data.suggestions)) {
          setYahooSuggestions(data.suggestions);
        }
      } catch {
        if (searchQueryRef.current === q) setYahooSuggestions([]);
      } finally {
        if (searchQueryRef.current === q) setSuggestionsLoading(false);
      }
    }, 280);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [inputSymbol]);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  useEffect(() => {
    setHighlightedIndex((i) => Math.min(i, Math.max(0, suggestions.length - 1)));
  }, [suggestions.length]);

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

  const FETCH_TIMEOUT_MS = 120000; // 2 min for multiple advisors + Gemini

  const fetchData = useCallback(async (sym: string) => {
    fetchIdRef.current += 1;
    const thisFetchId = fetchIdRef.current;
    setLoading(true);
    setError(null);
    setDiscussion([]);
    setDiscussing(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const advisorsForDiscussion = buildAdvisorsForDiscussion();
    const usePost = customAdvisors.length > 0 || Object.keys(instructionOverrides).length > 0;
    try {
      const [sentRes, discRes] = await Promise.all([
        fetch(apiUrl(`/api/sentiment?symbol=${encodeURIComponent(sym)}`), {
          signal: controller.signal,
        }),
        usePost && advisorsForDiscussion.length > 0
          ? fetch(apiUrl("/api/discussion"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                symbol: sym,
                advisors: advisorsForDiscussion,
                ...(userName && { forUser: userName }),
              }),
              signal: controller.signal,
            })
          : fetch(
              apiUrl(
                `/api/discussion?symbol=${encodeURIComponent(sym)}${
                  selectedAdvisorIds.length > 0
                    ? `&advisors=${encodeURIComponent(selectedAdvisorIds.join(","))}`
                    : ""
                }${userName ? `&forUser=${encodeURIComponent(userName)}` : ""}`
              ),
              { signal: controller.signal }
            ),
      ]);
      clearTimeout(timeoutId);
      if (thisFetchId !== fetchIdRef.current) return;
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
      if (thisFetchId !== fetchIdRef.current) return;
      setSentiment(sentJson);
      const messages = Array.isArray(discJson.messages) ? discJson.messages : [];
      setDiscussion(messages);
      setDiscussing(false);
    } catch (e) {
      clearTimeout(timeoutId);
      if (thisFetchId !== fetchIdRef.current) return;
      const message =
        e instanceof Error && e.name === "AbortError"
          ? "Request took too long. Try fewer advisors or try again."
          : e instanceof Error
            ? e.message
            : "Something went wrong.";
      setError(message);
      setSentiment(null);
      setDiscussion([]);
      setDiscussing(false);
    } finally {
      if (thisFetchId === fetchIdRef.current) {
        setLoading(false);
      }
    }
  }, [buildAdvisorsForDiscussion, customAdvisors, instructionOverrides, selectedAdvisorIds, userName]);

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
                aria-label="Gator Analyst home"
              >
                <img
                  src="/logo.png"
                  alt=""
                  className="h-9 w-9 rounded-full object-cover [mix-blend-mode:darken]"
                  width={36}
                  height={36}
                />
                <span className="font-display text-xl font-semibold text-ink tracking-tight">
                  Gator Analyst
                </span>
                <span className="text-mute text-sm hidden sm:inline">
                  Stock discussion
                </span>
              </a>
              <div className="flex items-center gap-3">
                {userName && (
                  <span className="text-sm text-mute hidden sm:inline" aria-label={`Signed in as ${userName}`}>
                    Hi, {userName}
                  </span>
                )}
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
              <span className="text-sm text-accent flex items-center gap-1 w-full sm:w-auto" title="Can take 1–2 min with multiple advisors">
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                Advisors discussing… (may take 1–2 min)
              </span>
            )}
          </div>

          <form
            onSubmit={handleSearch}
            className="flex flex-wrap gap-2"
            role="search"
            aria-label="Search by ticker"
          >
            <div className="relative" ref={searchWrapRef}>
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mute pointer-events-none"
                aria-hidden
              />
              <input
                type="text"
                value={inputSymbol}
                onChange={(e) => {
                  setInputSymbol(e.target.value.toUpperCase());
                  setShowSuggestions(true);
                  setHighlightedIndex(0);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={(e) => {
                  if (!showSuggestions || suggestions.length === 0) return;
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setHighlightedIndex((i) => Math.min(i + 1, suggestions.length - 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setHighlightedIndex((i) => Math.max(i - 1, 0));
                  } else if (e.key === "Enter" && suggestions[highlightedIndex]) {
                    e.preventDefault();
                    const s = suggestions[highlightedIndex];
                    setInputSymbol(s.symbol);
                    setSymbol(s.symbol);
                    setCompanyName(s.name);
                    setShowSuggestions(false);
                  } else if (e.key === "Escape") {
                    setShowSuggestions(false);
                  }
                }}
                placeholder="Symbol (e.g. AAPL)"
                maxLength={6}
                autoComplete="off"
                aria-label="Stock ticker symbol"
                aria-autocomplete="list"
                aria-expanded={showSuggestions && suggestions.length > 0}
                aria-controls="search-suggestions"
                id="symbol-search"
                className="w-40 sm:w-48 pl-9 pr-3 py-2 rounded-md bg-surface border border-border text-sm font-mono text-ink placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
              {showSuggestions && (suggestions.length > 0 || suggestionsLoading) && (
                <ul
                  id="search-suggestions"
                  role="listbox"
                  className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border-2 border-border bg-surface shadow-lg py-1 max-h-64 overflow-y-auto"
                >
                  {suggestionsLoading && suggestions.length === 0 ? (
                    <li className="px-3 py-3 text-sm text-mute flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                      Searching Yahoo Finance…
                    </li>
                  ) : (
                    suggestions.map((s, i) => (
                      <li
                        key={`${s.symbol}-${i}`}
                        role="option"
                        aria-selected={i === highlightedIndex}
                        className={`cursor-pointer px-3 py-2 text-sm flex flex-col gap-0.5 ${
                          i === highlightedIndex ? "bg-accent-mute text-ink" : "text-ink hover:bg-accent-mute/70"
                        }`}
                        onMouseEnter={() => setHighlightedIndex(i)}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setInputSymbol(s.symbol);
                          setSymbol(s.symbol);
                          setCompanyName(s.name);
                          setShowSuggestions(false);
                        }}
                      >
                        <span className="font-mono font-semibold">{s.symbol}</span>
                        <span className="text-mute text-xs truncate">{s.name}</span>
                      </li>
                    ))
                  )}
                </ul>
              )}
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

          <section className="rounded-lg border-2 border-orange bg-orange-mute p-4 sm:p-6">
            <StockChart symbol={symbol} />
          </section>

          {error && (
            <ErrorState message={error} onRetry={() => fetchData(symbol)} />
          )}

          {!error && loading && <MetricsSkeleton />}
          {!error && sentiment && (
            <MetricsCards
              pe={sentiment.pe}
              beta={sentiment.beta}
              fiftyTwoWeekPct={sentiment.fiftyTwoWeekPct}
              return1M={sentiment.return1M}
              vsSpy1M={sentiment.vsSpy1M}
              outperformRate={sentiment.outperformRate}
              avgOutperformance={sentiment.avgOutperformance}
              currentSentiment={sentiment.currentSentiment}
            />
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-8">
              <section className="rounded-lg border-2 border-orange bg-orange-mute p-6">
                <h2 className="text-xs font-medium text-mute uppercase tracking-wider mb-1">
                  Advisor discussion{userName ? ` for ${userName}` : ""} — pros & cons
                </h2>
                <p className="text-xs text-mute mb-4">
                  For discussion only. Not investment or financial advice.
                </p>
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
                    <SentimentGauge
                      score={sentiment.currentSentiment}
                      level={sentiment.currentLevel}
                      label="Momentum (sentiment)"
                    />
                    <p className="text-xs text-mute mt-2">From price data: 1-day, 1M return, 52w position</p>
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
                Gator Analyst
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
            <p className="mt-4 text-xs text-mute max-w-xl">
              <strong className="text-ink">Not financial advice.</strong> This
              site is for educational and entertainment only. Nothing here is a
              recommendation to buy, sell, or hold any security. Consult a
              licensed financial professional before making investment decisions.
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
