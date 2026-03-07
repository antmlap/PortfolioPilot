"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Sparkles, Loader2 } from "lucide-react";
import { ADVISOR_IDS } from "@/lib/advisors";
import { AdvisorAvatar } from "@/components/AdvisorAvatar";
import { DiscussionThread } from "@/components/DiscussionThread";
import { SentimentGauge } from "@/components/SentimentGauge";
import { SentimentChart } from "@/components/SentimentChart";
import { HeadlinesFeed } from "@/components/HeadlinesFeed";
import { MetricsCards } from "@/components/MetricsCards";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { AdvisorsSection } from "@/components/AdvisorsSection";
import { MetricsSkeleton, DiscussionSkeleton, SidebarSkeleton } from "@/components/LoadingSkeletons";
import { ErrorState } from "@/components/ErrorState";
import type { DiscussionMessage } from "@/lib/discussion";
import type { StockSentimentSummary } from "@/lib/sentiment";

const DEFAULT_SYMBOL = "AAPL";

export default function Home() {
  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [inputSymbol, setInputSymbol] = useState(DEFAULT_SYMBOL);
  const [sentiment, setSentiment] = useState<StockSentimentSummary | null>(null);
  const [discussion, setDiscussion] = useState<DiscussionMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [discussing, setDiscussing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (sym: string) => {
    setLoading(true);
    setError(null);
    try {
      const [sentRes, discRes] = await Promise.all([
        fetch(`/api/sentiment?symbol=${encodeURIComponent(sym)}`),
        fetch(`/api/discussion?symbol=${encodeURIComponent(sym)}`),
      ]);
      if (!sentRes.ok || !discRes.ok) throw new Error("Failed to load data");
      const sentData = await sentRes.json();
      const discData = await discRes.json();
      setSentiment(sentData);
      setDiscussion([]);
      setDiscussing(true);
      for (let i = 0; i < discData.messages.length; i++) {
        await new Promise((r) => setTimeout(r, 600));
        setDiscussion((prev) => [...prev, discData.messages[i]]);
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
  }, []);

  useEffect(() => {
    fetchData(symbol);
  }, [symbol, fetchData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const s = inputSymbol.trim().toUpperCase();
    if (s) setSymbol(s);
  };

  const handleSelectSymbol = (s: string) => {
    setInputSymbol(s);
    setSymbol(s);
  };

  return (
    <div className="min-h-screen bg-void bg-grid">
      {/* Header */}
      <header className="border-b border-slate-800/60 sticky top-0 z-10 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <a href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal to-gold flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-void" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Portfolio Pilot</h1>
                <p className="text-xs text-slate-500">Multi-agent stock advisory</p>
              </div>
            </a>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={inputSymbol}
                  onChange={(e) => setInputSymbol(e.target.value.toUpperCase())}
                  placeholder="Symbol (e.g. AAPL)"
                  className="w-32 sm:w-40 pl-9 pr-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-sm font-mono text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal/50 focus:border-teal"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-teal text-void font-semibold text-sm hover:bg-teal-bright transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Analyze"}
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Hero */}
        <Hero onSelectSymbol={handleSelectSymbol} isLoading={loading} />

        {/* Symbol & status */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-2xl font-bold text-white">{symbol}</span>
          {discussing && (
            <span className="text-xs text-teal flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Advisors discussing...
            </span>
          )}
        </div>

        {/* Error state */}
        {error && (
          <ErrorState message={error} onRetry={() => fetchData(symbol)} />
        )}

        {/* Metrics row */}
        {!error && loading && <MetricsSkeleton />}
        {!error && sentiment && (
          <MetricsCards
            outperformRate={sentiment.outperformRate}
            avgOutperformance={sentiment.avgOutperformance}
            currentSentiment={sentiment.currentSentiment}
          />
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left: Roundtable + Discussion */}
          <div className="xl:col-span-2 space-y-6">
            {/* Roundtable avatars */}
            <section className="glass rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Advisory panel
              </h2>
              <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
                {ADVISOR_IDS.map((id) => (
                  <AdvisorAvatar
                    key={id}
                    advisorId={id}
                    size="lg"
                    showName
                    isSpeaking={
                      discussion.length > 0 &&
                      discussion[discussion.length - 1]?.advisorId === id
                    }
                  />
                ))}
              </div>
            </section>

            {/* Discussion thread */}
            <section className="glass rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Advisor discussion — pros & cons
              </h2>
              {error ? null : loading ? (
                <DiscussionSkeleton />
              ) : discussion.length > 0 ? (
                <DiscussionThread messages={discussion} />
              ) : (
                <p className="text-slate-500 text-sm py-8 text-center">
                  Enter a symbol and click Analyze, or pick a ticker above to start the discussion.
                </p>
              )}
            </section>
          </div>

          {/* Right: Sentiment & news */}
          <div className="space-y-6">
            {loading && <SidebarSkeleton />}
            {!loading && !sentiment && !error && (
              <div className="glass rounded-2xl p-8 text-center text-slate-500 text-sm">
                Analyze a stock to see real-time sentiment, headlines, and sentiment vs performance.
              </div>
            )}
            {!loading && sentiment && (
              <>
                <section className="glass rounded-2xl p-6">
                  <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                    Real-time sentiment
                  </h2>
                  <SentimentGauge
                    score={sentiment.currentSentiment}
                    level={sentiment.currentLevel}
                    label="News sentiment"
                  />
                </section>
                <section className="glass rounded-2xl p-6">
                  <HeadlinesFeed headlines={sentiment.recentHeadlines} />
                </section>
                <section className="glass rounded-2xl p-6">
                  <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                    Sentiment vs performance
                  </h2>
                  <SentimentChart data={sentiment.historical} />
                </section>
              </>
            )}
          </div>
        </div>

        {/* How it works */}
        <HowItWorks />

        {/* Meet the advisors */}
        <AdvisorsSection />
      </main>

      <footer className="border-t border-slate-800/60 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal to-gold flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-void" />
              </div>
              <span className="text-sm font-medium text-slate-400">Portfolio Pilot</span>
            </div>
            <nav className="flex flex-wrap gap-6 text-sm text-slate-500">
              <a href="#how-it-works" className="hover:text-slate-300 transition-colors">
                How it works
              </a>
              <a href="#advisors" className="hover:text-slate-300 transition-colors">
                Advisors
              </a>
            </nav>
          </div>
          <p className="mt-4 text-xs text-slate-600">
            Hackathon project. Sentiment and historical data are simulated for demo; connect News API
            and market data APIs for production.
          </p>
        </div>
      </footer>
    </div>
  );
}
