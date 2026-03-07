/** Shared types for stock history chart (API + client). */

export type TimeframeKey = "1D" | "5D" | "1M" | "3M" | "1Y";

export interface StockHistoryPoint {
  date: string;
  price: number;
  label: string;
}
