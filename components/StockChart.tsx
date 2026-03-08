"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { apiUrl } from "@/lib/api";
import type { StockHistoryPoint, TimeframeKey } from "@/lib/stock-history";

/** Pick evenly spaced tick labels by index (O(maxTicks)). */
function getEvenlySpacedTicks(data: StockHistoryPoint[], maxTicks: number): string[] {
  if (data.length <= maxTicks) return data.map((d) => d.label);
  const step = (data.length - 1) / Math.max(1, maxTicks - 1);
  const tickLabels: string[] = [];
  for (let i = 0; i < maxTicks; i++) {
    const idx = Math.round(i * step);
    const label = data[Math.min(idx, data.length - 1)]?.label;
    if (label != null && !tickLabels.includes(label)) tickLabels.push(label);
  }
  return tickLabels.length ? tickLabels : data.map((d) => d.label).filter((_, i) => i % Math.ceil(data.length / maxTicks) === 0);
}

const TIMEFRAMES: { key: TimeframeKey; label: string }[] = [
  { key: "1D", label: "1D" },
  { key: "5D", label: "5D" },
  { key: "1M", label: "1M" },
  { key: "3M", label: "3M" },
  { key: "1Y", label: "1Y" },
];

interface StockChartProps {
  symbol: string;
  className?: string;
}

export function StockChart({ symbol, className }: StockChartProps) {
  const [timeframe, setTimeframe] = useState<TimeframeKey>("1M");
  const [data, setData] = useState<StockHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) {
      setData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const url = apiUrl(
      `/api/stock-history?symbol=${encodeURIComponent(symbol)}&timeframe=${encodeURIComponent(timeframe)}`
    );
    fetch(url)
      .then((res) => {
        if (!res.ok) return res.json().then((body) => Promise.reject(new Error(body?.error ?? "Failed to load")));
        return res.json();
      })
      .then((body: { data?: StockHistoryPoint[] }) => {
        setData(Array.isArray(body?.data) ? body.data : []);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load chart data");
        setData([]);
      })
      .finally(() => setLoading(false));
  }, [symbol, timeframe]);

  if (loading && data.length === 0) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-mute uppercase tracking-wider">Price</span>
          <div className="flex gap-1">
            {TIMEFRAMES.map(({ key, label }) => (
              <button key={key} type="button" disabled className="px-2.5 py-1 rounded text-xs font-medium bg-paper border border-border text-mute">
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[220px] flex items-center justify-center text-mute text-sm">Loading chart…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-mute uppercase tracking-wider">Price</span>
        </div>
        <p className="text-sm text-red-600 py-4">{error}</p>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-mute uppercase tracking-wider">Price</span>
        </div>
        <p className="text-xs text-mute py-4">No price data for this symbol.</p>
      </div>
    );
  }

  const minPrice = Math.min(...data.map((d) => d.price));
  const maxPrice = Math.max(...data.map((d) => d.price));
  const padding = (maxPrice - minPrice) * 0.05 || 1;
  const domain = [minPrice - padding, maxPrice + padding];

  const maxTicks = 6;
  const xTicks = getEvenlySpacedTicks(data, maxTicks);

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium text-mute uppercase tracking-wider">Price</span>
        <div className="flex gap-1">
          {TIMEFRAMES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTimeframe(key)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                timeframe === key
                  ? "bg-accent text-white"
                  : "bg-paper border border-border text-mute hover:text-ink hover:border-mute"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#b8c5d8" opacity={0.5} />
            <XAxis
              dataKey="label"
              ticks={xTicks}
              tick={{ fontSize: 10, fill: "#5a6376" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={domain}
              tick={{ fontSize: 10, fill: "#5a6376" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v.toFixed(2)}`}
              width={48}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#e5ecf5",
                border: "1px solid #b8c5d8",
                borderRadius: "6px",
                fontSize: "12px",
              }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
              labelFormatter={(_, payload) => {
                const point = payload?.[0]?.payload as StockHistoryPoint | undefined;
                return point?.date ? new Date(point.date).toLocaleString() : "";
              }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#0021A5"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#0021A5" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
