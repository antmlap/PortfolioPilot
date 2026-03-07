import { GoogleGenAI } from "@google/genai";
import { ADVISOR_IDS, ADVISORS, type AdvisorForDiscussion, type AdvisorId } from "./advisors";
import type { DiscussionMessage } from "./discussion";
import type { StockSentimentSummary } from "./sentiment";

const GEMINI_MODEL = "gemini-2.5-flash-lite";
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY ?? "",
});

function parseProCon(text: string): { content: string; isPro: boolean } {
  const t = text.trim();
  const proMatch = t.match(/\s*\((Pro|pro)\)\s*$/);
  const conMatch = t.match(/\s*\((Con|con)\)\s*$/);
  if (proMatch) {
    return {
      content: t.replace(/\s*\((Pro|pro)\)\s*$/, "").trim(),
      isPro: true,
    };
  }
  if (conMatch) {
    return {
      content: t.replace(/\s*\((Con|con)\)\s*$/, "").trim(),
      isPro: false,
    };
  }
  return { content: t, isPro: true };
}

function extractText(response: unknown): string {
  const r = response as { text?: string; candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  if (typeof r.text === "string" && r.text.trim()) return r.text;
  const part = r.candidates?.[0]?.content?.parts?.[0];
  return (part?.text as string) ?? "";
}

function getAdvisorName(advisorId: string, advisors: AdvisorForDiscussion[]): string {
  const a = advisors.find((x) => x.id === advisorId);
  return a?.name ?? advisorId;
}

export async function generateDiscussionWithGeminiFromAdvisors(
  symbol: string,
  sentiment: StockSentimentSummary,
  advisors: AdvisorForDiscussion[],
  options?: { forUser?: string | null }
): Promise<DiscussionMessage[]> {
  if (advisors.length === 0) return [];
  const forUser = options?.forUser?.trim() || null;

  const metricParts: string[] = [
    sentiment.pe != null ? `P/E (trailing): ${sentiment.pe}` : "",
    sentiment.forwardPE != null ? `Forward P/E: ${sentiment.forwardPE}` : "",
    sentiment.beta != null ? `Beta: ${sentiment.beta}` : "",
    sentiment.fiftyTwoWeekPct != null ? `52-week range position: ${sentiment.fiftyTwoWeekPct}%` : "",
    sentiment.return1M != null ? `1-month return: ${sentiment.return1M > 0 ? "+" : ""}${sentiment.return1M}%` : "",
    sentiment.vsSpy1M != null ? `1-month return vs S&P 500: ${sentiment.vsSpy1M > 0 ? "+" : ""}${sentiment.vsSpy1M}%` : "",
    sentiment.volumeVsAvg != null ? `Volume vs 3-month avg: ${(sentiment.volumeVsAvg * 100).toFixed(0)}%` : "",
    sentiment.dividendYield != null ? `Dividend yield: ${sentiment.dividendYield}%` : "",
    sentiment.eps != null ? `EPS (TTM): ${sentiment.eps}` : "",
  ].filter(Boolean);
  const newsLines = sentiment.newsHeadlines?.map((n) => n.text) ?? sentiment.recentHeadlines?.map((h) => h.text) ?? [];
  const newsSnippet = newsLines.slice(0, 5).join(" | ");
  const sentimentLine = `Market sentiment (momentum): ${sentiment.currentSentiment.toFixed(2)} (scale -1 bearish to +1 bullish, from price data).`;
  const context = `Stock: ${symbol}.
${sentimentLine}
${metricParts.length > 0 ? `Key metrics: ${metricParts.join("; ")}.` : ""}
${newsSnippet ? `Recent news/developments: ${newsSnippet}.` : ""}`;

  const messages: DiscussionMessage[] = [];

  for (let i = 0; i < advisors.length; i++) {
    const advisor = advisors[i];
    const priorTakes =
      messages.length > 0
        ? messages
            .map(
              (m) =>
                `${getAdvisorName(m.advisorId, advisors)}: ${m.content} (${m.isPro ? "Pro" : "Con"})`
            )
            .join("\n")
        : "No prior takes yet.";

    const forUserLine = forUser
      ? `You are advising ${forUser}. Address your take to them when natural. `
      : "";
    const focusLine = advisor.discussionFocus ?? "Focus on: What does the data mean for this company from your philosophy?";
    const userMessage = `${context}

Other advisors' takes so far:
${priorTakes}

${forUserLine}Your angle: ${focusLine}

Give a substantive take in 4–6 sentences. Use your angle above; do not just repeat the same points as other advisors. Emphasize your own lens (e.g. moat, growth, margin of safety, macro, disruption). Tie your view to the data and end with exactly "(Pro)" or "(Con)". Use the ticker "${symbol}".`;

    const systemInstruction = `You are ${advisor.name}. Follow these instructions:

${advisor.instructions}

Stock: ${symbol}. Give a complete take (4–6 sentences) from your philosophy. End with "(Pro)" or "(Con)".`;

    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ role: "user", parts: [{ text: userMessage }] }],
        config: {
          systemInstruction,
          maxOutputTokens: 512,
          temperature: 0.7,
        },
      });
      const raw = extractText(response);
      if (!raw || raw.includes("Error") || raw.length < 10) {
        throw new Error("Empty or invalid Gemini response");
      }
      const { content, isPro } = parseProCon(raw);
      messages.push({
        id: String(i + 1),
        advisorId: advisor.id,
        role: "advisor",
        content: content || raw,
        timestamp: new Date().toISOString(),
        isPro,
      });
    } catch (err) {
      console.error(`Gemini error for ${advisor.id}:`, err);
      throw err;
    }
  }

  return messages;
}

export async function generateDiscussionWithGemini(
  symbol: string,
  sentiment: StockSentimentSummary,
  advisorIds: AdvisorId[] = ADVISOR_IDS
): Promise<DiscussionMessage[]> {
  const advisors: AdvisorForDiscussion[] = advisorIds.map((id) => {
    const a = ADVISORS[id];
    return { id: a.id, name: a.name, title: a.title, instructions: a.instructions, discussionFocus: a.discussionFocus };
  });
  return generateDiscussionWithGeminiFromAdvisors(symbol, sentiment, advisors);
}
