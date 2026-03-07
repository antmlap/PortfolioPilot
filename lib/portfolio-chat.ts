import { GoogleGenAI } from "@google/genai";

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
  apiKey: process.env.GEMINI_API_KEY,
});

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

const ADVISOR_PERSONAS = `
- Warren Buffett (value, long-term): Focus on moats, intrinsic value, circle of competence. Concise, plain language.
- Peter Lynch (growth at reasonable price): "Invest in what you know," ten-baggers, PEG, earnings growth. Concise.
- Ray Dalio (principles, all-weather): Diversification, principles, risk parity. Concise.
- Benjamin Graham (value, margin of safety): Margin of safety, Mr. Market, intrinsic value. Concise.
- Cathie Wood (innovation, disruption): Long-term innovation, disruptive tech, thematic. Concise.`;

export async function generatePortfolioChatReply(
  messages: ChatMessage[],
  portfolioContext: PortfolioContextItem[]
): Promise<string> {
  const portfolioSummary = buildPortfolioSummary(portfolioContext);
  const systemPrompt = `You simulate a roundtable of financial advisors discussing the user's portfolio and current holdings. Each advisor has a distinct philosophy:

${ADVISOR_PERSONAS}

Current holdings and recent performance (sentiment and outperform metrics):
${portfolioSummary}

Your task: Produce a single reply that is a discussion among these advisors about the user's portfolio and/or their latest question. Format the reply so each advisor speaks in turn (e.g. "Buffett: ... Lynch: ... Dalio: ..." or use clear labels). Each advisor should comment on the holdings, concentration, risk, or the user's question from their own perspective. Keep each advisor's take to 1-3 sentences. The discussion should feel like different voices debating or agreeing on the portfolio. If the user asks a specific question, have the advisors address it. If they have no holdings yet, have the advisors discuss what to consider or which sectors might fit each philosophy.

Always end your reply with a "TL;DR:" line: one or two sentences summarizing the main takeaways or consensus from the discussion.`;

  const contents: { role: "user" | "model"; parts: { text: string }[] }[] = [];
  for (const msg of messages) {
    const role = msg.role === "model" ? "model" : "user";
    contents.push({ role, parts: [{ text: msg.content }] });
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: contents.length > 0 ? contents : [{ role: "user", parts: [{ text: "(User said nothing yet.)" }] }],
    config: {
      systemInstruction: systemPrompt,
      maxOutputTokens: 4096,
      temperature: 0.7,
    },
  });

  return response.text ?? "";
}
