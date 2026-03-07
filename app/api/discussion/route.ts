import { NextRequest, NextResponse } from "next/server";
import { ADVISOR_IDS, type AdvisorForDiscussion, type AdvisorId } from "@/lib/advisors";
import { generateMockDiscussion } from "@/lib/discussion";
import { generateDiscussionWithGemini, generateDiscussionWithGeminiFromAdvisors } from "@/lib/gemini-discussion";
import { getStockSentiment } from "@/lib/sentiment-api";
import { getMockStockSentiment, type StockSentimentSummary } from "@/lib/sentiment";
import { validateSymbol } from "@/lib/validation";

const VALID_IDS = new Set<string>(ADVISOR_IDS);

function parseAdvisorIds(param: string | null): AdvisorId[] {
  if (!param?.trim()) return [...ADVISOR_IDS];
  const ids = param.split(",").map((s) => s.trim().toLowerCase());
  const valid = ids.filter((id) => VALID_IDS.has(id as AdvisorId)) as AdvisorId[];
  return valid.length > 0 ? valid : [...ADVISOR_IDS];
}

function runDiscussion(
  symbol: string,
  sentimentSummary: StockSentimentSummary,
  advisors: AdvisorForDiscussion[]
) {
  if (advisors.length === 0) {
    return Promise.resolve([]);
  }
  const summary = {
    currentSentiment: sentimentSummary.currentSentiment,
    outperformRate: sentimentSummary.outperformRate,
    recentHeadlines: sentimentSummary.recentHeadlines,
  };
  if (process.env.GEMINI_API_KEY) {
    return generateDiscussionWithGeminiFromAdvisors(
      symbol,
      sentimentSummary,
      advisors
    ).catch((err) => {
      console.error("Gemini discussion error:", err);
      return generateMockDiscussion(symbol, summary, advisors.map((a) => a.id));
    });
  }
  return Promise.resolve(
    generateMockDiscussion(symbol, summary, advisors.map((a) => a.id))
  );
}

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
  const advisorIds = parseAdvisorIds(request.nextUrl.searchParams.get("advisors"));
  try {
    let sentimentSummary: StockSentimentSummary;
    try {
      sentimentSummary = await getStockSentiment(symbol);
    } catch {
      sentimentSummary = getMockStockSentiment(symbol);
    }

    if (process.env.GEMINI_API_KEY) {
      try {
        const messages = await generateDiscussionWithGemini(
          symbol,
          sentimentSummary,
          advisorIds
        );
        return NextResponse.json({ symbol, messages });
      } catch (err) {
        console.error("Gemini discussion error:", err);
      }
    }

    const messages = generateMockDiscussion(
      symbol,
      {
        currentSentiment: sentimentSummary.currentSentiment,
        outperformRate: sentimentSummary.outperformRate,
        recentHeadlines: sentimentSummary.recentHeadlines,
      },
      advisorIds
    );
    return NextResponse.json({ symbol, messages });
  } catch (err) {
    console.error("Discussion API error:", err);
    return NextResponse.json(
      { error: "Failed to generate discussion" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let body: { symbol?: string; advisors?: AdvisorForDiscussion[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { valid, symbol, error } = validateSymbol(body.symbol ?? null);
  if (!valid) {
    return NextResponse.json(
      { error: error ?? "Invalid symbol" },
      { status: 400 }
    );
  }
  const advisors = Array.isArray(body.advisors) ? body.advisors : [];
  if (advisors.length === 0) {
    return NextResponse.json(
      { error: "At least one advisor required" },
      { status: 400 }
    );
  }
  try {
    let sentimentSummary: StockSentimentSummary;
    try {
      sentimentSummary = await getStockSentiment(symbol);
    } catch {
      sentimentSummary = getMockStockSentiment(symbol);
    }
    const messages = await runDiscussion(symbol, sentimentSummary, advisors);
    return NextResponse.json({ symbol, messages });
  } catch (err) {
    console.error("Discussion API error:", err);
    return NextResponse.json(
      { error: "Failed to generate discussion" },
      { status: 500 }
    );
  }
}
