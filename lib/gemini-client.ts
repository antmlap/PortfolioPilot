/**
 * Shared Gemini API client and helpers.
 */

import { GoogleGenAI } from "@google/genai";

export const GEMINI_MODEL = "gemini-2.5-flash-lite";

export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY ?? "",
});

export function extractText(response: unknown): string {
  const r = response as {
    text?: string;
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  if (typeof r?.text === "string" && r.text.trim()) return r.text;
  const part = r?.candidates?.[0]?.content?.parts?.[0];
  return (part?.text as string) ?? "";
}
