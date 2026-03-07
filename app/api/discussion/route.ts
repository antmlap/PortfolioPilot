import { NextRequest, NextResponse } from "next/server";
import { generateMockDiscussion } from "@/lib/discussion";
import { generateDiscussionWithOpenAI } from "@/lib/openai-discussion";
import { getMockStockSentiment } from "@/lib/sentiment";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol")?.toUpperCase() || "AAPL";
  const sentimentSummary = getMockStockSentiment(symbol);

  if (process.env.OPENAI_API_KEY) {
    try {
      const messages = await generateDiscussionWithOpenAI(symbol, sentimentSummary);
      return NextResponse.json({ symbol, messages });
    } catch (err) {
      console.error("OpenAI discussion error:", err);
      // fallback to mock on error
    }
  }

  const messages = generateMockDiscussion(symbol, {
    currentSentiment: sentimentSummary.currentSentiment,
    outperformRate: sentimentSummary.outperformRate,
  });
  return NextResponse.json({ symbol, messages });
}
