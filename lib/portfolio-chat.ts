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

export async function generatePortfolioChatReply(
  messages: ChatMessage[],
  portfolioContext: PortfolioContextItem[]
): Promise<string> {
  const portfolioSummary = buildPortfolioSummary(portfolioContext);
  const systemPrompt = `You are a helpful portfolio advisor. The user can ask you for recommendations on their holdings, whether to rebalance, which sectors to consider, or what to add or trim.

Current holdings and recent performance (sentiment and outperform metrics):
${portfolioSummary}

Give concise, practical advice. Use plain language. You can suggest sectors or themes, comment on concentration risk, or recommend rebalancing. Do not give specific buy/sell orders unless the user asks. Keep responses focused and actionable.`;

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
      maxOutputTokens: 1024,
      temperature: 0.7,
    },
  });

  return response.text ?? "";
}
