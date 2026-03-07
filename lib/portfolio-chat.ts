import { GoogleGenAI } from "@google/genai";
import { ADVISOR_IDS, ADVISORS, type AdvisorId } from "./advisors";

export interface PortfolioContextItem {
  symbol: string;
  currentSentiment: number;
  outperformRate: number;
  avgOutperformance: number;
  headline?: string;
}

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY ?? "",
});

function extractText(response: unknown): string {
  const r = response as { text?: string; candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  if (typeof r?.text === "string" && r.text.trim()) return r.text;
  const part = r?.candidates?.[0]?.content?.parts?.[0];
  return (part?.text as string) ?? "";
}

function buildPortfolioSummary(context: PortfolioContextItem[]): string {
  if (context.length === 0) {
    return "The user has not added any holdings yet. They may be asking for general advice or sector ideas.";
  }
  return context
    .map(
      (c) =>
        `${c.symbol}: sentiment ${c.currentSentiment.toFixed(2)} (-1 to 1), ` +
        `outperform rate ${c.outperformRate}%, avg outperformance ${c.avgOutperformance > 0 ? "+" : ""}${c.avgOutperformance}%.` +
        (c.headline ? ` Recent: ${c.headline}` : "")
    )
    .join("\n");
}

const GENERAL_AI_SYSTEM_PROMPT = `You are a helpful financial assistant. Discuss the user's portfolio and holdings based on the data provided. Be concise and practical. If they have no holdings yet, offer general guidance or sector ideas.`;

function buildSystemPrompt(
  portfolioSummary: string,
  advisorId: string | undefined | null
): string {
  const contextBlock = `
Current holdings and recent performance (sentiment and outperform metrics):
${portfolioSummary}
`;

  if (!advisorId || advisorId === "general") {
    return `${GENERAL_AI_SYSTEM_PROMPT}
${contextBlock}
Answer the user's questions about their portfolio. Keep responses concise (2–4 sentences when appropriate).`;
  }

  if (ADVISOR_IDS.includes(advisorId as AdvisorId)) {
    const advisor = ADVISORS[advisorId as AdvisorId];
    return `You are roleplaying as ${advisor.name}. Follow these instructions exactly:

${advisor.instructions}
${contextBlock}
Respond in first person as ${advisor.name}. Comment on the user's portfolio, holdings, or their question from your investment philosophy. Keep your reply to 2–4 sentences unless the user asks for more.`;
  }

  return `${GENERAL_AI_SYSTEM_PROMPT}
${contextBlock}`;
}

export async function generatePortfolioChatReply(
  messages: ChatMessage[],
  portfolioContext: PortfolioContextItem[],
  advisorId?: string | null
): Promise<string> {
  const portfolioSummary = buildPortfolioSummary(portfolioContext);
  const systemPrompt = buildSystemPrompt(portfolioSummary, advisorId);

  const contents: { role: "user" | "model"; parts: { text: string }[] }[] = [];
  for (const msg of messages) {
    const role = msg.role === "model" ? "model" : "user";
    contents.push({ role, parts: [{ text: msg.content }] });
  }

  const payload = {
    model: "gemini-2.0-flash",
    contents: contents.length > 0 ? contents : [{ role: "user" as const, parts: [{ text: "(User said nothing yet.)" }] }],
    config: {
      systemInstruction: systemPrompt,
      maxOutputTokens: 4096,
      temperature: 0.7,
    },
  };

  const maxAttempts = 3;
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await ai.models.generateContent(payload);
      return extractText(response) || "";
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isRateLimit = msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota") || msg.includes("rate");
      if (isRateLimit && attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 6000));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}
