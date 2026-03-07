import { NextRequest, NextResponse } from "next/server";
import { getStockSentiment } from "@/lib/sentiment-api";
import {
  generatePortfolioChatReply,
  type ChatMessage,
  type PortfolioContextItem,
} from "@/lib/portfolio-chat";

export async function POST(request: NextRequest) {
  let body: { messages?: ChatMessage[]; symbols?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const symbols = Array.isArray(body.symbols)
    ? body.symbols.map((s) => String(s).toUpperCase().trim()).filter(Boolean)
    : [];

  const portfolioContext: PortfolioContextItem[] = await Promise.all(
    symbols.map(async (symbol) => {
      const summary = await getStockSentiment(symbol);
      return {
        symbol: summary.symbol,
        currentSentiment: summary.currentSentiment,
        outperformRate: summary.outperformRate,
        avgOutperformance: summary.avgOutperformance,
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
    const text = await generatePortfolioChatReply(messages, portfolioContext);
    return NextResponse.json({
      message: { role: "model" as const, content: text },
    });
  } catch (err) {
    console.error("Portfolio chat error:", err);
    return NextResponse.json(
      {
        message: {
          role: "model",
          content: "Sorry, I couldn't process that. Please try again.",
        },
      },
      { status: 200 }
    );
  }
}
