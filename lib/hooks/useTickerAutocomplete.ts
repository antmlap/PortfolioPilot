"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { apiUrl } from "@/lib/api";
import { SYMBOL_SUGGESTIONS_LIST } from "@/lib/symbols";
import { useClickOutside } from "./useClickOutside";

const DEBOUNCE_MS = 280;

export interface TickerSuggestion {
  symbol: string;
  name: string;
}

export function useTickerAutocomplete(initialInput = "") {
  const [input, setInput] = useState(initialInput);
  const [show, setShow] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [yahooSuggestions, setYahooSuggestions] = useState<TickerSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryRef = useRef("");

  const staticSuggestions = useMemo(() => {
    const q = input.trim().toUpperCase();
    if (!q) return SYMBOL_SUGGESTIONS_LIST.slice(0, 10);
    return SYMBOL_SUGGESTIONS_LIST.filter(
      (s) =>
        s.symbol.startsWith(q) ||
        s.symbol.includes(q) ||
        s.name.toUpperCase().includes(q)
    ).slice(0, 10);
  }, [input]);

  const suggestions = useMemo(() => {
    const q = input.trim();
    if (q.length >= 2 && yahooSuggestions.length > 0) return yahooSuggestions;
    return staticSuggestions;
  }, [input, yahooSuggestions, staticSuggestions]);

  useEffect(() => {
    const q = input.trim();
    if (q.length < 2) {
      setYahooSuggestions([]);
      setLoading(false);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      debounceRef.current = null;
      queryRef.current = q;
      try {
        const res = await fetch(apiUrl(`/api/symbol-search?q=${encodeURIComponent(q)}`));
        const data = (await res.json()) as { suggestions?: TickerSuggestion[] };
        if (queryRef.current === q && Array.isArray(data.suggestions)) {
          setYahooSuggestions(data.suggestions);
        }
      } catch {
        if (queryRef.current === q) setYahooSuggestions([]);
      } finally {
        if (queryRef.current === q) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [input]);

  useClickOutside(wrapRef, () => setShow(false));

  useEffect(() => {
    setHighlightedIndex((i) => Math.min(i, Math.max(0, suggestions.length - 1)));
  }, [suggestions.length]);

  return {
    input,
    setInput,
    show,
    setShow,
    highlightedIndex,
    setHighlightedIndex,
    suggestions,
    loading,
    wrapRef,
  };
}
