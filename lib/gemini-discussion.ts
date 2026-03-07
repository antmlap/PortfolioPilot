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
  const headlinesSnippet = sentiment.recentHeadlines
    .map((h) => `"${h.text}" (sentiment ${h.score.toFixed(2)})`)
    .join("; ");
  const context = `Stock: ${symbol}.
Current news sentiment score: ${sentiment.currentSentiment.toFixed(2)} (scale -1 to 1).
Historical outperform rate: ${sentiment.outperformRate}% of periods the stock beat its sentiment-implied return.
Average outperformance vs sentiment: ${sentiment.avgOutperformance}%.
Recent headlines: ${headlinesSnippet}.`;

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
    ? `You are advising ${forUser}. Address your take to them when natural (e.g. "For you, ..." or "In your case, ...") while staying in character. `
    : "";
  const userMessage = `${context}

Other advisors' takes so far:
${priorTakes}

${forUserLine}Give a substantive investment take on ${symbol} using the data above. Be specific to this company—do not give generic advice. Write 4–6 complete sentences. Explain what the headlines, sentiment (${sentiment.currentSentiment.toFixed(2)}), and outperform rate (${sentiment.outperformRate}%) mean for ${symbol} from your investment philosophy. Be insightful: connect the data to your view (moat, growth, risk, margin of safety, disruption, etc.). Use the exact ticker "${symbol}". If you're favorable, say why the data supports that (Pro); if cautious, explain the risks (Con). End your response with exactly "(Pro)" or "(Con)". Do not truncate—finish your thought.`;

    const systemInstruction = `You are roleplaying as ${advisor.name}. Follow these instructions exactly:

${advisor.instructions}

Critical: The stock is ${symbol}. Give a complete, insightful take (4–6 sentences). Explain what the data means for this stock from your philosophy—don't just list numbers. If you choose Pro, your reasoning should support being favorable; if Con, explain the risks. Use only the ticker "${symbol}". Write in full sentences and do not cut off mid-thought.`;

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
    return { id: a.id, name: a.name, title: a.title, instructions: a.instructions };
  });
  return generateDiscussionWithGeminiFromAdvisors(symbol, sentiment, advisors);
}
