"use client";

import { useState, useCallback } from "react";
import { AppHeader } from "@/components/AppHeader";
import { SentimentGauge } from "@/components/SentimentGauge";
import type { StockSentimentSummary } from "@/lib/sentiment";
import { Loader2, Plus, MessageSquare, Send, Trash2 } from "lucide-react";
import clsx from "clsx";

export default function PortfolioPage() {
  const [tickerInput, setTickerInput] = useState("");
  const [symbols, setSymbols] = useState<string[]>([]);
  const [holdings, setHoldings] = useState<StockSentimentSummary[]>([]);
  const [addingSymbol, setAddingSymbol] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ role: "user" | "model"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

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
      setSymbols((prev) => [...prev, symbol]);
      setHoldings((prev) => [...prev, data]);
      setTickerInput("");
    } catch (e) {
      setAddError(e instanceof Error ? e.message : `Failed to add ${symbol}.`);
    } finally {
      setAddingSymbol(null);
    }
  }, [tickerInput, symbols]);

  const removeFromPortfolio = useCallback((symbol: string) => {
    setSymbols((prev) => prev.filter((s) => s !== symbol));
    setHoldings((prev) => prev.filter((h) => h.symbol !== symbol));
  }, []);

  const sendChat = useCallback(async () => {
    const text = chatInput.trim();
    if (!text || sendingChat) return;
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
        body: JSON.stringify({ messages: nextMessages, symbols }),
      });
      const data = await res.json();
      const modelContent = data?.message?.content ?? "No response.";
      setMessages((prev) => [...prev, { role: "model", content: modelContent }]);
    } catch (e) {
      setChatError(e instanceof Error ? e.message : "Send failed.");
    } finally {
      setSendingChat(false);
    }
  }, [chatInput, sendingChat, messages, symbols]);

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader />

      <main id="main" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink tracking-tight">
            My Portfolio
          </h1>
          <p className="text-mute text-sm mt-1">
            Add tickers to see performance and chat with AI for recommendations and sector ideas.
          </p>
        </div>

        {/* Add one holding */}
        <section className="rounded-lg border-2 border-orange bg-orange-mute p-6">
          <h2 className="text-xs font-medium text-mute uppercase tracking-wider mb-3">
            Add to portfolio
          </h2>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={tickerInput}
              onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && addToPortfolio()}
              placeholder="e.g. AAPL"
              className="flex-1 min-w-[140px] px-3 py-2 rounded-md bg-surface border border-border text-sm font-mono text-ink placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
            <button
              type="button"
              onClick={addToPortfolio}
              disabled={addingSymbol !== null || !tickerInput.trim()}
              className="px-4 py-2 rounded-md bg-accent text-white font-medium text-sm hover:bg-accent-hover transition-colors disabled:opacity-50 flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              {addingSymbol ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Plus className="w-4 h-4" aria-hidden />}
              Add to portfolio
            </button>
          </div>
          {addError && (
            <p className="text-negative text-sm mt-2" role="alert">
              {addError}
            </p>
          )}
        </section>

        {/* Holdings / performance */}
        <section className="rounded-lg border-2 border-orange bg-orange-mute p-6">
          <h2 className="text-xs font-medium text-mute uppercase tracking-wider mb-4">
            Holdings & recent performance
          </h2>
          {holdings.length === 0 && !addingSymbol && (
            <p className="text-mute text-sm py-8 text-center">
              Add a ticker above to see sentiment and performance.
            </p>
          )}
          {(holdings.length > 0 || addingSymbol) && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-mute uppercase tracking-wider text-xs">
                    <th className="pb-3 pr-4 font-semibold">Symbol</th>
                    <th className="pb-3 pr-4 font-semibold">Sentiment</th>
                    <th className="pb-3 pr-4 font-semibold">Outperform rate</th>
                    <th className="pb-3 pr-4 font-semibold">Avg outperformance</th>
                    <th className="pb-3 pr-4 font-semibold">Recent</th>
                    <th className="pb-3 w-10 font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {addingSymbol && !holdings.some((h) => h.symbol === addingSymbol) && (
                    <tr className="border-b border-border">
                      <td className="py-3 pr-4 font-mono font-semibold text-ink">{addingSymbol}</td>
                      <td colSpan={4} className="py-3 pr-4 text-mute flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                        Loading…
                      </td>
                      <td className="py-3"></td>
                    </tr>
                  )}
                  {holdings.map((h) => (
                    <tr key={h.symbol} className="border-b border-border">
                      <td className="py-3 pr-4 font-mono font-semibold text-ink">{h.symbol}</td>
                      <td className="py-3 pr-4">
                        <div className="w-28">
                          <SentimentGauge
                            score={h.currentSentiment}
                            level={h.currentLevel}
                            label=""
                          />
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-ink font-mono">{h.outperformRate}%</td>
                      <td
                        className={clsx(
                          "py-3 pr-4 font-mono",
                          h.avgOutperformance >= 0 ? "text-positive" : "text-negative"
                        )}
                      >
                        {h.avgOutperformance > 0 ? "+" : ""}{h.avgOutperformance}%
                      </td>
                      <td className="py-3 pr-4 text-mute max-w-[200px] truncate" title={h.recentHeadlines[0]?.text}>
                        {h.recentHeadlines[0]?.text ?? "—"}
                      </td>
                      <td className="py-3">
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Chat */}
        <section className="rounded-lg border-2 border-orange bg-orange-mute p-6 flex flex-col">
          <h2 className="text-xs font-medium text-mute uppercase tracking-wider mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" aria-hidden />
            Chat with AI
          </h2>
          <p className="text-mute text-xs mb-4">
            Ask for portfolio recommendations, rebalancing ideas, or which sectors to consider.
          </p>
          <div className="flex-1 min-h-[200px] max-h-[400px] overflow-y-auto scrollbar-thin space-y-4 mb-4">
            {messages.length === 0 && (
              <p className="text-mute text-sm py-4">Send a message to get started.</p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={clsx(
                  "rounded-lg px-4 py-3 max-w-[85%] border",
                  msg.role === "user"
                    ? "ml-auto bg-accent-mute border-border text-ink"
                    : "mr-auto bg-surface border-border text-ink"
                )}
              >
                <p className="text-xs font-medium text-mute mb-1">
                  {msg.role === "user" ? "You" : "Advisor"}
                </p>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}
          </div>
          {chatError && (
            <p className="text-negative text-sm mb-2" role="alert">
              {chatError}
            </p>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChat()}
              placeholder="Ask for recommendations..."
              className="flex-1 px-3 py-2 rounded-md bg-surface border border-border text-sm text-ink placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
            <button
              type="button"
              onClick={sendChat}
              disabled={sendingChat || !chatInput.trim()}
              className="px-4 py-2 rounded-md bg-accent text-white font-medium text-sm hover:bg-accent-hover transition-colors disabled:opacity-50 flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              {sendingChat ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Send className="w-4 h-4" aria-hidden />}
              Send
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
