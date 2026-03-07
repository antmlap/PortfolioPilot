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
  if (!data?.length) {
    return (
      <div className={className}>
        <p className="text-xs text-mute font-mono">No historical data yet.</p>
      </div>
    );
  }
  const chartData = data.map((d) => ({
    ...d,
    dateShort: d.date.slice(5),
    outperformedLabel: d.outperformed ? "Outperformed" : "Underperformed",
  }));

  return (
    <div className={className}>
      <p className="text-xs text-mute mb-2 font-mono">
        Historical: sentiment vs actual return (green = outperformed)
      </p>
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
          >
            <defs>
              <linearGradient id="sentimentGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0021A5" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#0021A5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="dateShort"
              tick={{ fontSize: 10, fill: "#6b6b6b" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 10, fill: "#6b6b6b" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <ReferenceLine
              yAxisId="left"
              y={0}
              stroke="#e5e2dd"
              strokeDasharray="2 2"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#f7faf2",
                border: "1px solid #e5e2dd",
                borderRadius: "6px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#6b6b6b" }}
              formatter={(value: number, name: string) => [
                name === "actualReturn"
                  ? `${value.toFixed(2)}%`
                  : value.toFixed(2),
                name === "actualReturn" ? "Actual return" : "Sentiment",
              ]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="actualReturn"
              stroke="#0021A5"
              strokeWidth={2}
              fill="url(#sentimentGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
