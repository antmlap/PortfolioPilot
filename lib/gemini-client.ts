/**
 * Shared Gemini API client and helpers.
 * Client is created lazily so the API key is read at request time (avoids empty key at module load).
 */

import { GoogleGenAI } from "@google/genai";

export const GEMINI_MODEL = "gemini-3.1-flash-lite-preview";

let _envLoaded = false;

function ensureEnvLoaded(): void {
  if (_envLoaded || typeof process === "undefined") return;
  const key = (process.env.GEMINI_API_KEY ?? "").trim();
  if (key) return;
  _envLoaded = true;
  try {
    const path = require("path");
    const dotenv = require("dotenv");
    dotenv.config({ path: path.join(process.cwd(), ".env.local") });
  } catch {
    // dotenv or path not available (e.g. edge runtime)
  }
}

function getApiKey(): string {
  ensureEnvLoaded();
  return (process.env.GEMINI_API_KEY ?? "").trim();
}

/** Use this in API routes so env is loaded before checking; returns whether a key is configured. */
export function hasGeminiApiKey(): boolean {
  return getApiKey().length > 0;
}

let _cachedClient: GoogleGenAI | null = null;
let _cachedKey: string = "";

/** Returns the Gemini client, using current env so the key is always read at request time. */
export function getAi(): GoogleGenAI {
  const key = getApiKey();
  if (_cachedClient && _cachedKey === key) return _cachedClient;
  _cachedKey = key;
  _cachedClient = new GoogleGenAI({ apiKey: key });
  return _cachedClient;
}

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30_000;

function isRetryableError(err: unknown): boolean {
  const e = err as { status?: number; code?: number; message?: string };
  const status = e?.status ?? e?.code;
  if (status === 429 || status === 503) return true;
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("503") ||
    msg.includes("resource_exhausted") ||
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("too many requests") ||
    msg.includes("service unavailable")
  );
}

/**
 * Exponential backoff with jitter: delay = min(cap, base * 2^attempt) * (0.5 + random * 0.5).
 * Jitter spreads retries so many clients don't hit the API at the same time (avoids 429 spikes).
 */
function backoffDelayMs(attempt: number): number {
  const base = Math.min(MAX_BACKOFF_MS, INITIAL_BACKOFF_MS * Math.pow(2, attempt));
  const jitter = 0.5 + Math.random() * 0.5; // 50%–100% of base
  return Math.round(base * jitter);
}

/** Call a Gemini API function with retries on 429/503 using exponential backoff with jitter. */
export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === MAX_RETRIES || !isRetryableError(err)) throw err;
      const delayMs = backoffDelayMs(attempt);
      console.warn(
        `Gemini rate limit / retryable error (attempt ${attempt + 1}/${MAX_RETRIES + 1}), retrying in ${delayMs}ms:`,
        err instanceof Error ? err.message : err
      );
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastError;
}

/** Delay between sequential advisor calls to avoid bursting the rate limit. */
export const ADVISOR_CALL_DELAY_MS = 2000;

export function extractText(response: unknown): string {
  const r = response as {
    text?: string;
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  if (typeof r?.text === "string" && r.text.trim()) return r.text;
  const part = r?.candidates?.[0]?.content?.parts?.[0];
  return (part?.text as string) ?? "";
}
