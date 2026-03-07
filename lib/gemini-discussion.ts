import { GoogleGenAI } from "@google/genai";
import { ADVISOR_IDS, ADVISORS, type AdvisorId } from "./advisors";
import type { DiscussionMessage } from "./discussion";
import type { StockSentimentSummary } from "./sentiment";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
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

export async function generateDiscussionWithGemini(
  symbol: string,
  sentiment: StockSentimentSummary
): Promise<DiscussionMessage[]> {
  const headlinesSnippet = sentiment.recentHeadlines
    .map((h) => `"${h.text}" (sentiment ${h.score.toFixed(2)})`)
    .join("; ");
  const context = `Stock: ${symbol}.
Current news sentiment score: ${sentiment.currentSentiment.toFixed(2)} (scale -1 to 1).
Historical outperform rate: ${sentiment.outperformRate}% of periods the stock beat its sentiment-implied return.
Average outperformance vs sentiment: ${sentiment.avgOutperformance}%.
Recent headlines: ${headlinesSnippet}.`;

  const messages: DiscussionMessage[] = [];

  for (let i = 0; i < ADVISOR_IDS.length; i++) {
    const advisorId = ADVISOR_IDS[i] as AdvisorId;
    const advisor = ADVISORS[advisorId];
    const priorTakes =
      messages.length > 0
        ? messages
            .map(
              (m) =>
                `${ADVISORS[m.advisorId].name}: ${m.content} (${m.isPro ? "Pro" : "Con"})`
            )
            .join("\n")
        : "No prior takes yet.";

    const userMessage = `${context}

Other advisors' takes so far:
${priorTakes}

Give your brief investment take on ${symbol} in 2-4 sentences, from your usual perspective. Say whether you're generally favorable (Pro) or cautious (Con) and why. End your response with exactly "(Pro)" or "(Con)".`;

    const fullPrompt = `You are roleplaying as ${advisor.name}. Follow these instructions exactly:

${advisor.instructions}

---
${userMessage}`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: fullPrompt,
        config: {
          maxOutputTokens: 200,
          temperature: 0.7,
        },
      });
      const raw = response.text ?? "";
      const { content, isPro } = parseProCon(raw);
      messages.push({
        id: String(i + 1),
        advisorId,
        role: "advisor",
        content: content || raw,
        timestamp: new Date().toISOString(),
        isPro,
      });
    } catch (err) {
      console.error(`Gemini error for ${advisorId}:`, err);
      messages.push({
        id: String(i + 1),
        advisorId,
        role: "advisor",
        content: `[Error generating take for ${advisor.name}. Please try again.]`,
        timestamp: new Date().toISOString(),
        isPro: true,
      });
    }
  }

  return messages;
}
