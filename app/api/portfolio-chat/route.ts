import { NextRequest, NextResponse } from "next/server";
import { getStockSentiment } from "@/lib/sentiment-api";
import {
  generatePortfolioChatReply,
  type ChatMessage,
  type PortfolioContextItem,
} from "@/lib/portfolio-chat";

export async function POST(request: NextRequest) {
  let body: { messages?: ChatMessage[]; symbols?: string[]; advisorId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const advisorId = typeof body.advisorId === "string" ? body.advisorId.trim() || undefined : undefined;
  const symbols = Array.isArray(body.symbols)
    ? body.symbols.map((s) => String(s).toUpperCase().trim()).filter(Boolean)
    : [];

  const portfolioContext: PortfolioContextItem[] = await Promise.all(
    symbols.map(async (symbol) => {
      const summary = await getStockSentiment(symbol);
      return {
        symbol: summary.symbol,
        pe: summary.pe,
        forwardPE: summary.forwardPE,
        marketCap: summary.marketCap,
        beta: summary.beta,
        fiftyTwoWeekPct: summary.fiftyTwoWeekPct,
        return1M: summary.return1M,
        vsSpy1M: summary.vsSpy1M,
        volumeVsAvg: summary.volumeVsAvg,
        dividendYield: summary.dividendYield,
        eps: summary.eps,
        currentSentiment: summary.currentSentiment,
        newsHeadlines: summary.newsHeadlines,
        headline: summary.recentHeadlines[0]?.text,
      };
    })
  );

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({
      message: {
        role: "model",
        content:
          "Portfolio chat is not configured (missing GEMINI_API_KEY). Add your API key in .env.local to get advisor discussions.",
      },
    });
  }

  try {
    const text = await generatePortfolioChatReply(messages, portfolioContext, advisorId);
    return NextResponse.json({
      message: { role: "model" as const, content: text },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Portfolio chat error:", err);
    const isRateLimit = message.includes("429") || message.includes("RESOURCE_EXHAUSTED") || message.includes("quota") || message.includes("rate limit");
    const userMessage = isRateLimit
      ? "You've hit the free tier rate limit. Please wait a minute and try again."
      : process.env.NODE_ENV === "development" && message
        ? `Sorry, I couldn't process that. (${message})`
        : "Sorry, I couldn't process that. Please try again. Check that GEMINI_API_KEY is set in .env.local and valid.";
    return NextResponse.json(
      {
        message: { role: "model" as const, content: userMessage },
      },
      { status: 200 }
    );
  }
}
