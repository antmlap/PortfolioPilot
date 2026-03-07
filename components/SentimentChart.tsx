"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { SentimentVsPerformance } from "@/lib/sentiment";

interface SentimentChartProps {
  data: SentimentVsPerformance[];
  className?: string;
}

export function SentimentChart({ data, className }: SentimentChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    dateShort: d.date.slice(5),
    outperformedLabel: d.outperformed ? "Outperformed" : "Underperformed",
  }));

  return (
    <div className={className}>
      <p className="text-xs text-slate-400 mb-2 font-mono">
        Historical: Sentiment vs actual return (green = outperformed sentiment)
      </p>
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="sentimentGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="dateShort"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <ReferenceLine yAxisId="left" y={0} stroke="#475569" strokeDasharray="2 2" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e2732",
                border: "1px solid #334155",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#94a3b8" }}
              formatter={(value: number, name: string) => [
                name === "actualReturn" ? `${value.toFixed(2)}%` : value.toFixed(2),
                name === "actualReturn" ? "Actual return" : "Sentiment",
              ]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="actualReturn"
              stroke="#2dd4bf"
              strokeWidth={2}
              fill="url(#sentimentGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
