"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { AppHeader } from "@/components/AppHeader";
import type { StockSentimentSummary } from "@/lib/sentiment";
import type { StockHistoryPoint } from "@/lib/stock-history";
import { SYMBOL_SUGGESTIONS_LIST } from "@/lib/symbols";
import { apiUrl } from "@/lib/api";
import { SentimentGauge } from "@/components/SentimentGauge";
import { ADVISORS, ADVISOR_IDS } from "@/lib/advisors";
import { Loader2, Plus, MessageSquare, Send, Trash2, ChevronDown, Check, Pencil, PieChart as PieChartIcon, TrendingUp } from "lucide-react";
import clsx from "clsx";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const ACCENT_COLOR = "#1d4ed8";

const PORTFOLIO_STORAGE_KEY = "portfolio-pilot-symbols";
const PORTFOLIO_DETAILS_KEY = "portfolio-pilot-details";

export interface PortfolioEntryDetails {
  shares?: number;
  investedDollars?: number;
}

const CHAT_OPTIONS: { id: string; name: string; title: string; avatar: string; tagline: string }[] = [
  ...ADVISOR_IDS.map((id) => {
    const a = ADVISORS[id];
    return { id, name: a.name, title: a.title, avatar: a.avatar, tagline: a.tagline };
  }),
  { id: "general", name: "General AI", title: "No specific persona", avatar: "🤖", tagline: "Chat with a general financial assistant." },
];

function formatShares(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n % 1 === 0 ? String(n) : n.toFixed(2);
}

function formatDollars(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function EditSharesDollars({
  symbol,
  initialShares,
  initialDollars,
  currentPrice,
  onSave,
  onCancel,
}: {
  symbol: string;
  initialShares?: number;
  initialDollars?: number;
  currentPrice?: number | null;
  onSave: (symbol: string, details: PortfolioEntryDetails) => void;
  onCancel: () => void;
}) {
  const [shares, setShares] = useState(String(initialShares ?? ""));
  const [dollars, setDollars] = useState(initialDollars != null ? String(initialDollars) : "");
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <input
        type="number"
        min={0}
        step="any"
        value={shares}
        onChange={(e) => setShares(e.target.value)}
        placeholder="Shares"
        className="w-16 px-1.5 py-1 rounded border border-border text-xs font-mono bg-surface text-ink"
        aria-label="Shares"
      />
      <input
        type="text"
        inputMode="decimal"
        value={dollars}
        onChange={(e) => setDollars(e.target.value.replace(/[^0-9.]/g, ""))}
        placeholder="$"
        className="w-16 px-1.5 py-1 rounded border border-border text-xs font-mono bg-surface text-ink"
        aria-label="Dollars invested"
      />
      <button
        type="button"
        onClick={() => {
          let s = shares.trim() === "" ? undefined : parseFloat(shares);
          let d = dollars.trim() === "" ? undefined : parseFloat(dollars);
          const price = currentPrice != null && currentPrice > 0 ? currentPrice : null;
          if (s != null && !Number.isNaN(s) && s >= 0 && price != null && d == null) d = Math.round(s * price * 100) / 100;
          if (d != null && !Number.isNaN(d) && d >= 0 && price != null && s == null) s = Math.round((d / price) * 10000) / 10000;
          const details: PortfolioEntryDetails = {};
          if (s != null && !Number.isNaN(s) && s >= 0) details.shares = s;
          if (d != null && !Number.isNaN(d) && d >= 0) details.investedDollars = d;
          onSave(symbol, details);
        }}
        className="px-1.5 py-1 rounded bg-accent text-white text-xs hover:bg-accent-hover"
      >
        Save
      </button>
      <button type="button" onClick={onCancel} className="px-1.5 py-1 rounded border border-border text-xs text-mute hover:text-ink">
        Cancel
      </button>
    </div>
  );
}

const ALLOCATION_COLORS = ["#1d4ed8", "#ea580c", "#0d6b4c", "#7c3aed", "#0891b2", "#b45309", "#be185d", "#4b5563"];

export default function PortfolioPage() {
  const [tickerInput, setTickerInput] = useState("");
  const [addMode, setAddMode] = useState<"shares" | "dollars">("shares");
  const [addAmount, setAddAmount] = useState("");
  const [symbols, setSymbols] = useState<string[]>([]);
  const [entryDetails, setEntryDetails] = useState<Record<string, PortfolioEntryDetails>>({});
  const [holdings, setHoldings] = useState<StockSentimentSummary[]>([]);
  const [addingSymbol, setAddingSymbol] = useState<string | null>(null);
  const [editingSymbol, setEditingSymbol] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [selectedAdvisor, setSelectedAdvisor] = useState<string | null>("general");
  const [advisorDropdownOpen, setAdvisorDropdownOpen] = useState(false);
  const advisorDropdownRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<{ role: "user" | "model"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [portfolioHistory, setPortfolioHistory] = useState<{ date: string; label: string; value: number }[]>([]);
  const [portfolioHistoryLoading, setPortfolioHistoryLoading] = useState(false);
  const [showTickerSuggestions, setShowTickerSuggestions] = useState(false);
  const [tickerHighlightedIndex, setTickerHighlightedIndex] = useState(0);
  const [yahooTickerSuggestions, setYahooTickerSuggestions] = useState<{ symbol: string; name: string }[]>([]);
  const [tickerSuggestionsLoading, setTickerSuggestionsLoading] = useState(false);
  const tickerSearchWrapRef = useRef<HTMLDivElement>(null);
  const tickerSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickerSearchQueryRef = useRef<string>("");

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (advisorDropdownRef.current && !advisorDropdownRef.current.contains(e.target as Node)) {
        setAdvisorDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
    const detailsRaw = localStorage.getItem(PORTFOLIO_DETAILS_KEY);
    try {
      let details: Record<string, PortfolioEntryDetails> = {};
      if (detailsRaw) {
        const parsed = JSON.parse(detailsRaw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          details = Object.fromEntries(
            Object.entries(parsed).filter(
              ([k, v]) => /^[A-Z]{1,5}(\.[A-Z])?$/.test(String(k)) && v && typeof v === "object"
            ).map(([k, v]) => {
              const o = v as Record<string, unknown>;
              return [
                String(k).toUpperCase(),
                {
                  shares: typeof o.shares === "number" && o.shares >= 0 ? o.shares : undefined,
                  investedDollars: typeof o.investedDollars === "number" && o.investedDollars >= 0 ? o.investedDollars : undefined,
                },
              ];
            })
          );
        }
      }
      setEntryDetails(details);
    } catch {
      // ignore invalid details
    }
    if (!raw) return;
    try {
      const stored = JSON.parse(raw);
      if (!Array.isArray(stored) || stored.some((s: unknown) => typeof s !== "string")) return;
      const list = (stored as string[])
        .map((s) => String(s).trim().toUpperCase())
        .filter((s) => /^[A-Z]{1,5}(\.[A-Z])?$/.test(s));
      if (list.length === 0) return;
      setSymbols(list);
      Promise.all(
        list.map((symbol) =>
          fetch(`/api/sentiment?symbol=${encodeURIComponent(symbol)}&strict=true`).then((r) => (r.ok ? r.json() : null))
        )
      ).then((results) => {
        const summaries = results.filter((r): r is StockSentimentSummary => r != null);
        setHoldings(summaries);
      });
    } catch {
      // ignore invalid stored data
    }
  }, []);

  // Fetch 1M history for each symbol and compute combined portfolio performance (indexed to 100 at start).
  useEffect(() => {
    if (symbols.length === 0) {
      setPortfolioHistory([]);
      return;
    }
    let cancelled = false;
    setPortfolioHistoryLoading(true);
    Promise.all(
      symbols.map((symbol) =>
        fetch(`/api/stock-history?symbol=${encodeURIComponent(symbol)}&timeframe=1M`)
          .then((r) => (r.ok ? r.json() : null))
          .then((body: { data?: StockHistoryPoint[] } | null) => (body?.data ? { symbol, data: body.data } : null))
      )
    )
      .then((results) => {
        if (cancelled) return;
        const series = results.filter((r): r is { symbol: string; data: StockHistoryPoint[] } => r != null && r.data.length > 0);
        if (series.length === 0) {
          setPortfolioHistory([]);
          return;
        }
        const allDates = new Set<string>();
        series.forEach((s) => s.data.forEach((p) => allDates.add(p.date)));
        const sortedDates = Array.from(allDates).sort();
        if (sortedDates.length === 0) {
          setPortfolioHistory([]);
          return;
        }
        const firstDate = sortedDates[0];
        const priceBySymbolByDate = new Map<string, Map<string, number>>();
        series.forEach(({ symbol, data }) => {
          const byDate = new Map<string, number>();
          data.forEach((p) => {
            if (p.price > 0) byDate.set(p.date, p.price);
          });
          const firstPrice = data.find((p) => p.price > 0)?.price ?? 0;
          let last = firstPrice;
          for (const d of sortedDates) {
            if (byDate.has(d)) last = byDate.get(d)!;
            else byDate.set(d, last);
          }
          priceBySymbolByDate.set(symbol, byDate);
        });
        const firstPrices = new Map<string, number>();
        priceBySymbolByDate.forEach((byDate, sym) => {
          firstPrices.set(sym, byDate.get(firstDate) ?? 0);
        });
        const symbolsWithData = series.map((s) => s.symbol);
        const totalDollars = symbolsWithData.reduce((sum, s) => sum + (entryDetails[s]?.investedDollars ?? 0), 0);
        let weights: Record<string, number>;
        if (totalDollars > 0) {
          weights = Object.fromEntries(symbolsWithData.map((s) => [s, (entryDetails[s]?.investedDollars ?? 0) / totalDollars]));
        } else {
          const totalByShares = symbolsWithData.reduce((sum, s) => {
            const sh = entryDetails[s]?.shares ?? 0;
            const p0 = firstPrices.get(s) ?? 0;
            return sum + sh * p0;
          }, 0);
          if (totalByShares > 0) {
            weights = Object.fromEntries(
              symbolsWithData.map((s) => {
                const sh = entryDetails[s]?.shares ?? 0;
                const p0 = firstPrices.get(s) ?? 0;
                return [s, (sh * p0) / totalByShares];
              })
            );
          } else {
            const n = symbolsWithData.length;
            weights = Object.fromEntries(symbolsWithData.map((s) => [s, 1 / n]));
          }
        }
        const labelByDate = new Map<string, string>();
        series[0]?.data.forEach((p) => labelByDate.set(p.date, p.label));
        const combined = sortedDates.map((date) => {
          const portfolioValue = symbolsWithData.reduce((sum, s) => {
            const w = weights[s] ?? 0;
            const byDate = priceBySymbolByDate.get(s);
            const p = byDate?.get(date) ?? 0;
            const pFirst = firstPrices.get(s) ?? 0;
            if (pFirst <= 0) return sum;
            return sum + w * (p / pFirst);
          }, 0);
          return {
            date,
            label: labelByDate.get(date) ?? new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            value: Math.round(100 * portfolioValue * 100) / 100,
          };
        });
        setPortfolioHistory(combined);
      })
      .catch(() => {
        if (!cancelled) setPortfolioHistory([]);
      })
      .finally(() => {
        if (!cancelled) setPortfolioHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [symbols, entryDetails]);

  const tickerStaticSuggestions = useMemo(() => {
    const q = tickerInput.trim().toUpperCase();
    if (!q) return SYMBOL_SUGGESTIONS_LIST.slice(0, 10);
    return SYMBOL_SUGGESTIONS_LIST.filter(
      (s) =>
        s.symbol.startsWith(q) ||
        s.symbol.includes(q) ||
        s.name.toUpperCase().includes(q)
    ).slice(0, 10);
  }, [tickerInput]);

  const tickerSuggestions = useMemo(() => {
    const q = tickerInput.trim();
    if (q.length >= 2 && yahooTickerSuggestions.length > 0) return yahooTickerSuggestions;
    return tickerStaticSuggestions;
  }, [tickerInput, yahooTickerSuggestions, tickerStaticSuggestions]);

  useEffect(() => {
    const q = tickerInput.trim();
    if (q.length < 2) {
      setYahooTickerSuggestions([]);
      setTickerSuggestionsLoading(false);
      if (tickerSearchDebounceRef.current) {
        clearTimeout(tickerSearchDebounceRef.current);
        tickerSearchDebounceRef.current = null;
      }
      return;
    }
    if (tickerSearchDebounceRef.current) clearTimeout(tickerSearchDebounceRef.current);
    setTickerSuggestionsLoading(true);
    tickerSearchDebounceRef.current = setTimeout(async () => {
      tickerSearchDebounceRef.current = null;
      tickerSearchQueryRef.current = q;
      try {
        const res = await fetch(apiUrl(`/api/symbol-search?q=${encodeURIComponent(q)}`));
        const data = (await res.json()) as { suggestions?: { symbol: string; name: string }[] };
        if (tickerSearchQueryRef.current === q && Array.isArray(data.suggestions)) {
          setYahooTickerSuggestions(data.suggestions);
        }
      } catch {
        if (tickerSearchQueryRef.current === q) setYahooTickerSuggestions([]);
      } finally {
        if (tickerSearchQueryRef.current === q) setTickerSuggestionsLoading(false);
      }
    }, 280);
    return () => {
      if (tickerSearchDebounceRef.current) clearTimeout(tickerSearchDebounceRef.current);
    };
  }, [tickerInput]);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (tickerSearchWrapRef.current && !tickerSearchWrapRef.current.contains(e.target as Node)) {
        setShowTickerSuggestions(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  useEffect(() => {
    setTickerHighlightedIndex((i) => Math.min(i, Math.max(0, tickerSuggestions.length - 1)));
  }, [tickerSuggestions.length]);

  const addToPortfolio = useCallback(async () => {
    const symbol = tickerInput.trim().toUpperCase();
    if (!symbol) return;
    if (!/^[A-Z]{1,5}(\.[A-Z])?$/.test(symbol)) {
      setAddError("Invalid symbol. Use 1–5 letters, e.g. AAPL or BRK.A");
      return;
    }
    if (symbols.includes(symbol)) {
      setAddError(`${symbol} is already in your portfolio.`);
      return;
    }
    const shares = addMode === "shares" && addAmount.trim() !== "" ? parseFloat(addAmount) : undefined;
    const dollars = addMode === "dollars" && addAmount.trim() !== "" ? parseFloat(addAmount.replace(/[$,]/g, "")) : undefined;
    if (addAmount.trim() !== "" && addMode === "shares" && (Number.isNaN(shares!) || shares! < 0)) {
      setAddError("Enter a valid number of shares (0 or more).");
      return;
    }
    if (addAmount.trim() !== "" && addMode === "dollars" && (Number.isNaN(dollars!) || dollars! < 0)) {
      setAddError("Enter a valid dollar amount (0 or more).");
      return;
    }
    setAddError(null);
    setAddingSymbol(symbol);
    try {
      const res = await fetch(`/api/sentiment?symbol=${encodeURIComponent(symbol)}&strict=true`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = (err as { error?: string }).error || (res.status === 404 ? `${symbol} not found. Enter a valid stock ticker.` : `Failed to load ${symbol}`);
        throw new Error(msg);
      }
      const data: StockSentimentSummary = await res.json();
      const nextSymbols = [...symbols, symbol];
      const details: PortfolioEntryDetails = {};
      const price = data.price != null && data.price > 0 ? data.price : null;
      if (shares != null && !Number.isNaN(shares)) {
        details.shares = shares;
        if (price != null) details.investedDollars = Math.round(shares * price * 100) / 100;
      }
      if (dollars != null && !Number.isNaN(dollars)) {
        details.investedDollars = dollars;
        if (price != null) details.shares = Math.round((dollars / price) * 10000) / 10000;
      }
      const nextDetails = { ...entryDetails, [symbol]: details };
      setSymbols(nextSymbols);
      setEntryDetails(nextDetails);
      setHoldings((prev) => [...prev, data]);
      setTickerInput("");
      setAddAmount("");
      if (typeof window !== "undefined") {
        localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(nextSymbols));
        localStorage.setItem(PORTFOLIO_DETAILS_KEY, JSON.stringify(nextDetails));
      }
    } catch (e) {
      setAddError(e instanceof Error ? e.message : `Failed to add ${symbol}.`);
    } finally {
      setAddingSymbol(null);
    }
  }, [tickerInput, symbols, addMode, addAmount, entryDetails]);

  const removeFromPortfolio = useCallback((symbol: string) => {
    setSymbols((prev) => {
      const next = prev.filter((s) => s !== symbol);
      if (typeof window !== "undefined") {
        localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
    setEntryDetails((prev) => {
      const next = { ...prev };
      delete next[symbol];
      if (typeof window !== "undefined") {
        localStorage.setItem(PORTFOLIO_DETAILS_KEY, JSON.stringify(next));
      }
      return next;
    });
    setHoldings((prev) => prev.filter((h) => h.symbol !== symbol));
    setEditingSymbol((s) => (s === symbol ? null : s));
  }, []);

  const updateEntryDetails = useCallback((symbol: string, details: PortfolioEntryDetails) => {
    setEntryDetails((prev) => {
      const next = { ...prev, [symbol]: details };
      if (typeof window !== "undefined") {
        localStorage.setItem(PORTFOLIO_DETAILS_KEY, JSON.stringify(next));
      }
      return next;
    });
    setEditingSymbol(null);
  }, []);

  const sendChat = useCallback(async () => {
    const text = chatInput.trim();
    if (!text || sendingChat || !selectedAdvisor) return;
    const userMessage = { role: "user" as const, content: text };
    setMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setSendingChat(true);
    setChatError(null);
    const nextMessages = [...messages, userMessage];
    try {
      const res = await fetch("/api/portfolio-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, symbols, entryDetails, advisorId: selectedAdvisor }),
      });
      const data = await res.json();
      const modelContent = data?.message?.content ?? "No response.";
      setMessages((prev) => [...prev, { role: "model", content: modelContent }]);
    } catch (e) {
      setChatError(e instanceof Error ? e.message : "Send failed.");
    } finally {
      setSendingChat(false);
    }
  }, [chatInput, sendingChat, messages, symbols, entryDetails, selectedAdvisor]);

  const allocationData = holdings.map((h, i) => {
    const details = entryDetails[h.symbol];
    const value = details?.investedDollars ?? details?.shares ?? 1;
    return { name: h.symbol, value: value > 0 ? value : 1, fill: ALLOCATION_COLORS[i % ALLOCATION_COLORS.length] };
  });

  const totalPortfolioValue = holdings.reduce((sum, h) => {
    const d = entryDetails[h.symbol] ?? {};
    const pv =
      d.shares != null && h.price != null ? d.shares * h.price : (d.investedDollars ?? 0);
    return sum + pv;
  }, 0);

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader />

      <main id="main" className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-5">
          <h1 className="font-display text-2xl font-semibold text-ink tracking-tight">
            My Portfolio
          </h1>
          <p className="text-mute text-sm mt-0.5">
            Allocation, performance, and chat with advisors.
          </p>
        </div>

        {/* Two-column grid: Left ~65% (chart + table), Right ~35% (allocation + chat) */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.85fr)_minmax(320px,1fr)] gap-6">
          {/* Left column: Performance chart + Holdings table */}
          <div className="min-w-0 flex flex-col gap-5">
            {(holdings.length > 0 || addingSymbol) && (
              <>
                {/* Portfolio performance (1 month) – top of left column */}
                <div className="rounded-xl border border-border bg-paper/80 overflow-hidden shadow-sm">
                  <p className="text-xs font-semibold text-mute uppercase tracking-wider pt-4 px-4 pb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Portfolio performance (1 month)
                  </p>
                  <div className="px-4 pb-4">
                    {portfolioHistoryLoading ? (
                      <div className="h-[260px] flex items-center justify-center text-mute text-sm">
                        <Loader2 className="w-6 h-6 animate-spin mr-2" aria-hidden />
                        Loading performance…
                      </div>
                    ) : portfolioHistory.length > 0 ? (
                      <div className="h-[260px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={portfolioHistory}
                            margin={{ top: 12, right: 16, left: 8, bottom: 8 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} />
                            <XAxis
                              dataKey="label"
                              tick={{ fontSize: 11, fill: "var(--mute)" }}
                              axisLine={false}
                              tickLine={false}
                              interval="preserveStartEnd"
                            />
                            <YAxis
                              domain={["auto", "auto"]}
                              tick={{ fontSize: 11, fill: "var(--mute)" }}
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={(v) => `${v}`}
                              width={36}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "var(--paper)",
                                border: "1px solid var(--border)",
                                borderRadius: 8,
                                fontSize: 12,
                              }}
                              formatter={(value: number) => [value.toFixed(1), "Index (100 = start)"]}
                              labelFormatter={(label) => `Date: ${label}`}
                            />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke={ACCENT_COLOR}
                              strokeWidth={2.5}
                              dot={false}
                              activeDot={{ r: 4, fill: ACCENT_COLOR }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-[260px] flex items-center justify-center text-mute text-sm">
                        No history data for combined portfolio.
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Holdings & performance – always shown; add bar in header */}
            <div className="rounded-xl border border-border bg-paper/80 overflow-hidden shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 pt-4 px-4 pb-2">
                <p className="text-xs font-semibold text-mute uppercase tracking-wider">
                  Holdings & performance
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <div className="relative" ref={tickerSearchWrapRef}>
                    <input
                      type="text"
                      value={tickerInput}
                      onChange={(e) => {
                        setTickerInput(e.target.value.toUpperCase());
                        setShowTickerSuggestions(true);
                        setTickerHighlightedIndex(0);
                      }}
                      onFocus={() => setShowTickerSuggestions(true)}
                      onKeyDown={(e) => {
                        if (showTickerSuggestions && tickerSuggestions.length > 0) {
                          if (e.key === "ArrowDown") {
                            e.preventDefault();
                            setTickerHighlightedIndex((i) => Math.min(i + 1, tickerSuggestions.length - 1));
                          } else if (e.key === "ArrowUp") {
                            e.preventDefault();
                            setTickerHighlightedIndex((i) => Math.max(i - 1, 0));
                          } else if (e.key === "Enter" && tickerSuggestions[tickerHighlightedIndex]) {
                            e.preventDefault();
                            const s = tickerSuggestions[tickerHighlightedIndex];
                            setTickerInput(s.symbol);
                            setShowTickerSuggestions(false);
                          } else if (e.key === "Escape") {
                            setShowTickerSuggestions(false);
                          }
                          return;
                        }
                        if (e.key === "Enter") addToPortfolio();
                      }}
                      placeholder="Ticker"
                      maxLength={6}
                      autoComplete="off"
                      aria-label="Stock ticker"
                      aria-autocomplete="list"
                      aria-expanded={showTickerSuggestions && tickerSuggestions.length > 0}
                      aria-controls="portfolio-ticker-suggestions"
                      className="w-20 px-2 py-1 rounded border border-border bg-paper text-xs font-mono text-ink placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-accent/30"
                    />
                    {showTickerSuggestions && (tickerSuggestions.length > 0 || tickerSuggestionsLoading) && (
                      <ul
                        id="portfolio-ticker-suggestions"
                        role="listbox"
                        className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-md border border-border bg-paper shadow-lg py-1 max-h-56 overflow-y-auto"
                      >
                        {tickerSuggestionsLoading && tickerSuggestions.length === 0 ? (
                          <li className="px-2 py-2 text-xs text-mute flex items-center gap-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                            Searching…
                          </li>
                        ) : (
                          tickerSuggestions.map((s, i) => (
                            <li
                              key={`${s.symbol}-${i}`}
                              role="option"
                              aria-selected={i === tickerHighlightedIndex}
                              className={clsx(
                                "cursor-pointer px-2 py-1.5 text-xs flex flex-col gap-0.5",
                                i === tickerHighlightedIndex ? "bg-accent-mute text-ink" : "text-ink hover:bg-accent-mute/70"
                              )}
                              onMouseEnter={() => setTickerHighlightedIndex(i)}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setTickerInput(s.symbol);
                                setShowTickerSuggestions(false);
                              }}
                            >
                              <span className="font-mono font-semibold">{s.symbol}</span>
                              <span className="text-mute truncate">{s.name}</span>
                            </li>
                          ))
                        )}
                      </ul>
                    )}
                  </div>
                  <div className="flex rounded overflow-hidden border border-border bg-paper">
                    <button
                      type="button"
                      onClick={() => setAddMode("shares")}
                      className={clsx(
                        "px-2 py-1 text-xs font-medium transition-colors",
                        addMode === "shares" ? "bg-accent text-white" : "text-mute hover:text-ink"
                      )}
                    >
                      Shares
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddMode("dollars")}
                      className={clsx(
                        "px-2 py-1 text-xs font-medium transition-colors",
                        addMode === "dollars" ? "bg-accent text-white" : "text-mute hover:text-ink"
                      )}
                    >
                      $
                    </button>
                  </div>
                  <input
                    type={addMode === "shares" ? "number" : "text"}
                    inputMode={addMode === "dollars" ? "decimal" : "numeric"}
                    min={0}
                    step="any"
                    value={addAmount}
                    onChange={(e) => setAddAmount(addMode === "dollars" ? e.target.value.replace(/[^0-9.]/g, "") : e.target.value)}
                    placeholder={addMode === "shares" ? "Qty" : "Amt"}
                    className="w-16 px-2 py-1 rounded border border-border bg-paper text-xs font-mono text-ink placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-accent/30"
                    aria-label={addMode === "shares" ? "Shares" : "Amount"}
                  />
                  <button
                    type="button"
                    onClick={addToPortfolio}
                    disabled={addingSymbol !== null || !tickerInput.trim()}
                    className="px-2 py-1 rounded bg-accent text-white text-xs font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    {addingSymbol ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden /> : <Plus className="w-3.5 h-3.5" aria-hidden />}
                    Add
                  </button>
                </div>
              </div>
              {addError && (
                <p className="text-negative text-xs px-4 pb-2" role="alert">
                  {addError}
                </p>
              )}
              {holdings.length === 0 && !addingSymbol ? (
                <div className="px-4 pb-6 pt-2 text-center">
                  <p className="text-mute text-sm">No holdings yet. Add a ticker using the controls above.</p>
                </div>
              ) : (
                <div className="overflow-x-auto px-4 pb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-mute uppercase tracking-wider text-xs">
                    <th className="py-2 pr-3 font-semibold">Symbol</th>
                    <th className="py-2 pr-3 font-semibold w-24">Invested</th>
                    <th className="py-2 pr-3 font-semibold w-20">Shares</th>
                    <th className="py-2 pr-3 font-semibold w-20">Price</th>
                    <th className="py-2 pr-3 font-semibold w-24">Unrealized P/L</th>
                    <th className="py-2 pr-3 font-semibold w-16">1M</th>
                    <th className="py-2 pr-3 font-semibold w-16">% Port</th>
                    <th className="py-2 pr-3 font-semibold w-20">Avg Cost</th>
                    <th className="py-2 pr-3 font-semibold w-14">Beta</th>
                    <th className="py-2 pr-3 font-semibold w-24">Sentiment</th>
                    <th className="py-2 w-9 font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {addingSymbol && !holdings.some((h) => h.symbol === addingSymbol) && (
                    <tr className="border-b border-border">
                      <td className="py-2 pr-3 font-mono font-semibold text-ink">{addingSymbol}</td>
                      <td colSpan={9} className="py-2 pr-3 text-mute flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                        Loading…
                      </td>
                      <td className="py-2"></td>
                    </tr>
                  )}
                  {holdings.map((h) => {
                    const details = entryDetails[h.symbol] ?? {};
                    const isEditing = editingSymbol === h.symbol;
                    const avgCost =
                      details.shares != null &&
                      details.investedDollars != null &&
                      details.shares > 0
                        ? details.investedDollars / details.shares
                        : null;
                    const positionValue =
                      details.shares != null && h.price != null
                        ? details.shares * h.price
                        : (details.investedDollars ?? 0);
                    const pctPortfolio =
                      totalPortfolioValue > 0
                        ? (positionValue / totalPortfolioValue) * 100
                        : 0;
                    const unrealizedPlDollars =
                      details.shares != null &&
                      h.price != null &&
                      avgCost != null
                        ? details.shares * (h.price - avgCost)
                        : null;
                    const unrealizedPlPct =
                      h.price != null && avgCost != null && avgCost > 0
                        ? ((h.price - avgCost) / avgCost) * 100
                        : null;
                    return (
                    <tr key={h.symbol} className="border-b border-border">
                      <td className="py-2 pr-3 font-mono font-semibold text-ink">{h.symbol}</td>
                      {isEditing ? (
                        <td colSpan={2} className="py-2 pr-3">
                          <EditSharesDollars
                            symbol={h.symbol}
                            initialShares={details.shares}
                            initialDollars={details.investedDollars}
                            currentPrice={h.price}
                            onSave={updateEntryDetails}
                            onCancel={() => setEditingSymbol(null)}
                          />
                        </td>
                      ) : (
                        <>
                          <td className="py-2 pr-3 font-mono text-ink">
                            {details.investedDollars != null ? formatDollars(details.investedDollars) : "—"}
                          </td>
                          <td className="py-2 pr-3">
                            <span className="inline-flex items-center gap-1">
                              <span className="font-mono text-ink">
                                {details.shares != null ? formatShares(details.shares) : "—"}
                              </span>
                              <button
                                type="button"
                                onClick={() => setEditingSymbol(h.symbol)}
                                className="p-1 rounded text-mute hover:text-ink hover:bg-surface transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                                title="Edit shares or amount invested"
                              >
                                <Pencil className="w-3.5 h-3.5" aria-hidden />
                              </button>
                            </span>
                          </td>
                        </>
                      )}
                      <td className="py-2 pr-3 font-mono text-ink">
                        {h.price != null ? `$${h.price.toFixed(2)}` : "—"}
                      </td>
                      <td
                        className={clsx(
                          "py-2 pr-3 font-mono text-xs",
                          unrealizedPlDollars != null
                            ? unrealizedPlDollars >= 0
                              ? "text-positive"
                              : "text-negative"
                            : ""
                        )}
                      >
                        {unrealizedPlDollars != null ? (
                          <>
                            {unrealizedPlDollars >= 0 ? "+" : ""}
                            {formatDollars(unrealizedPlDollars)}
                            {unrealizedPlPct != null ? (
                              <span className="block text-[11px]">
                                ({unrealizedPlPct >= 0 ? "+" : ""}
                                {unrealizedPlPct.toFixed(1)}%)
                              </span>
                            ) : null}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td
                        className={clsx(
                          "py-2 pr-3 font-mono",
                          (h.return1M ?? 0) >= 0 ? "text-positive" : "text-negative"
                        )}
                      >
                        {h.return1M != null ? `${h.return1M > 0 ? "+" : ""}${h.return1M}%` : "—"}
                      </td>
                      <td className="py-2 pr-3 font-mono text-ink">
                        {totalPortfolioValue > 0 ? `${pctPortfolio.toFixed(1)}%` : "—"}
                      </td>
                      <td className="py-2 pr-3 font-mono text-ink">
                        {avgCost != null ? `$${avgCost.toFixed(2)}` : "—"}
                      </td>
                      <td className="py-2 pr-3 font-mono text-ink">{h.beta != null ? h.beta.toFixed(2) : "—"}</td>
                      <td className="py-2 pr-3 w-24" title="Momentum score from price data (-1 to +1)">
                        {h.currentSentiment != null && h.currentLevel != null ? (
                          <div className="w-20">
                            <SentimentGauge score={h.currentSentiment} level={h.currentLevel} label="" />
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-2">
                        <button
                          type="button"
                          onClick={() => removeFromPortfolio(h.symbol)}
                          className="p-1.5 rounded-md text-mute hover:text-negative hover:bg-surface transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                          title="Remove from portfolio"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden />
                        </button>
                      </td>
                    </tr>
                  );})}
                </tbody>
              </table>
                </div>
              )}
              {holdings.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border px-4 pb-4">
                  <p className="text-xs font-semibold text-mute uppercase tracking-wider mb-3">
                    Recent news
                  </p>
                  <ul className="space-y-3">
                    {holdings.map((h) => {
                      const first =
                        h.newsHeadlines?.[0]?.text ?? h.recentHeadlines?.[0]?.text;
                      return (
                        <li key={h.symbol} className="text-sm">
                          <span className="font-mono font-semibold text-ink">{h.symbol}</span>
                          <span className="text-mute ml-2">
                            — {first ?? "No recent headlines"}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Right column: Allocation + Chat sidebar */}
          <div className="min-w-0 flex flex-col gap-5 lg:sticky lg:top-4 lg:self-start">
            {/* Allocation: compact squarish card */}
            {allocationData.length > 0 && (
              <div className="rounded-xl border border-border bg-paper/80 overflow-hidden shadow-sm">
                <p className="text-xs font-semibold text-mute uppercase tracking-wider pt-4 px-4 pb-2 flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4" />
                  Allocation
                </p>
                <div className="p-4 flex justify-center" style={{ minHeight: 200 }}>
                  <div className="w-full aspect-square max-w-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={allocationData}
                          cx="50%"
                          cy="50%"
                          innerRadius={42}
                          outerRadius={68}
                          paddingAngle={2}
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {allocationData.map((entry) => (
                            <Cell key={entry.name} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number, name: string) => [v >= 100 || (v > 0 && v !== 1) ? formatDollars(v) : "Equal weight", name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Chat with advisors: tall vertical window */}
            <section className="rounded-xl border-2 border-orange bg-orange-mute flex flex-col shadow-sm flex-1 min-h-[320px] lg:min-h-[420px]">
              <h2 className="text-xs font-semibold text-mute uppercase tracking-wider pt-4 px-4 pb-1 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" aria-hidden />
                Chat with advisors
              </h2>
              <p className="text-mute text-xs px-4 pb-3">
                Ask about your portfolio. Choose an advisor below.
              </p>

              <div className="flex-1 min-h-[200px] overflow-y-auto scrollbar-thin space-y-3 px-4 pb-3 flex flex-col">
                {!selectedAdvisor && (
                  <p className="text-mute text-sm py-4">Choose who to chat with from the selector below.</p>
                )}
                {selectedAdvisor && messages.length === 0 && (
                  <p className="text-mute text-sm py-4">
                    Send a message to chat with {selectedAdvisor === "general" ? "General AI" : CHAT_OPTIONS.find((o) => o.id === selectedAdvisor)?.name}.
                  </p>
                )}
                {messages.map((msg, i) => (
              <div
                key={i}
                className={clsx(
                  "rounded-lg px-3 py-2 max-w-[90%] border text-sm",
                  msg.role === "user"
                    ? "ml-auto bg-accent-mute border-border text-ink"
                    : "mr-auto bg-surface border-border text-ink"
                )}
              >
                <p className="text-xs font-medium text-mute mb-0.5">
                  {msg.role === "user" ? "You" : selectedAdvisor === "general" ? "General AI" : CHAT_OPTIONS.find((o) => o.id === selectedAdvisor)?.name ?? "Advisor"}
                </p>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
                ))}
              </div>
              {chatError && (
                <p className="text-negative text-xs px-4 pb-2" role="alert">
                  {chatError}
                </p>
              )}
              <div className="flex items-end gap-0 rounded-b-xl border-t border-orange/30 bg-surface overflow-visible">
                <div className="relative flex-shrink-0 overflow-visible" ref={advisorDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setAdvisorDropdownOpen((o) => !o)}
                    className="flex items-center gap-2 px-3 py-2.5 h-full min-h-[48px] text-left hover:bg-paper/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-inset"
                    aria-expanded={advisorDropdownOpen}
                    aria-haspopup="listbox"
                    aria-label="Choose advisor"
                  >
                    <span className="text-base">
                      {selectedAdvisor ? CHAT_OPTIONS.find((o) => o.id === selectedAdvisor)?.avatar : "💬"}
                    </span>
                    <span className="text-xs font-medium text-ink max-w-[100px] truncate">
                      {selectedAdvisor ? CHAT_OPTIONS.find((o) => o.id === selectedAdvisor)?.name : "Advisor"}
                    </span>
                    <ChevronDown className={clsx("w-4 h-4 text-mute flex-shrink-0 transition-transform", advisorDropdownOpen && "rotate-180")} aria-hidden />
                  </button>
                  {advisorDropdownOpen && (
                    <div
                      className="absolute bottom-full left-0 mb-1 w-[280px] rounded-lg border border-border bg-paper shadow-lg overflow-hidden z-[100]"
                      role="listbox"
                      aria-label="Advisor options"
                    >
                      <div className="p-2 border-b border-border">
                        <p className="text-xs font-semibold text-mute uppercase tracking-wider px-2 py-1">Advisors</p>
                      </div>
                      <div className="max-h-[240px] overflow-y-auto py-1">
                        {CHAT_OPTIONS.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            role="option"
                            aria-selected={selectedAdvisor === opt.id}
                            onClick={() => {
                              setSelectedAdvisor(opt.id);
                              setAdvisorDropdownOpen(false);
                            }}
                            className={clsx(
                              "w-full flex items-start gap-2 px-3 py-2.5 text-left rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-inset",
                              selectedAdvisor === opt.id ? "bg-orange-mute" : "hover:bg-surface"
                            )}
                          >
                            <span className="text-xl flex-shrink-0 mt-0.5">{opt.avatar}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-ink">{opt.name}</p>
                              <p className="text-xs text-mute mt-0.5 line-clamp-1">{opt.tagline}</p>
                            </div>
                            {selectedAdvisor === opt.id && (
                              <Check className="w-4 h-4 text-accent flex-shrink-0" aria-hidden />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChat()}
                  placeholder="Ask about your portfolio..."
                  className="flex-1 min-w-0 px-3 py-2.5 bg-transparent text-sm text-ink placeholder:text-mute focus:outline-none focus:ring-0 border-0"
                />
                <button
                  type="button"
                  onClick={sendChat}
                  disabled={sendingChat || !chatInput.trim() || !selectedAdvisor}
                  className="flex-shrink-0 p-2.5 text-accent hover:bg-paper/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-inset"
                  aria-label="Send"
                >
                  {sendingChat ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden /> : <Send className="w-5 h-5" aria-hidden />}
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
