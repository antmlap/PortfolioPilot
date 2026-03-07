import { NextRequest, NextResponse } from "next/server";
import { generateMockDiscussion } from "@/lib/discussion";
import { generateDiscussionWithGemini } from "@/lib/gemini-discussion";
import { getMockStockSentiment } from "@/lib/sentiment";
import { validateSymbol } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const { valid, symbol, error } = validateSymbol(
    request.nextUrl.searchParams.get("symbol")
  );
  if (!valid) {
    return NextResponse.json(
      { error: error ?? "Invalid symbol" },
      { status: 400 }
    );
  }
  try {
    const sentimentSummary = getMockStockSentiment(symbol);

    if (process.env.GEMINI_API_KEY) {
      try {
        const messages = await generateDiscussionWithGemini(
          symbol,
          sentimentSummary
        );
        return NextResponse.json({ symbol, messages });
      } catch (err) {
        console.error("Gemini discussion error:", err);
        // fallback to mock on error
      }
    }

    const messages = generateMockDiscussion(symbol, {
      currentSentiment: sentimentSummary.currentSentiment,
      outperformRate: sentimentSummary.outperformRate,
    });
    return NextResponse.json({ symbol, messages });
  } catch (err) {
    console.error("Discussion API error:", err);
    return NextResponse.json(
      { error: "Failed to generate discussion" },
      { status: 500 }
    );
  }
}
