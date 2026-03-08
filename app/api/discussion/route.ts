import { NextRequest, NextResponse } from "next/server";
import { ADVISOR_IDS, ADVISORS, type AdvisorForDiscussion, type AdvisorId } from "@/lib/advisors";
import { generateMockDiscussion } from "@/lib/discussion";
import { generateDiscussionWithGeminiFromAdvisors } from "@/lib/gemini-discussion";
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

async function runDiscussion(
  symbol: string,
  sentimentSummary: StockSentimentSummary,
  advisors: AdvisorForDiscussion[],
  forUser?: string | null
): Promise<{ messages: Awaited<ReturnType<typeof generateDiscussionWithGeminiFromAdvisors>>; fromMock: boolean }> {
  if (advisors.length === 0) {
    return { messages: [], fromMock: false };
  }
  const summary = {
    currentSentiment: sentimentSummary.currentSentiment,
    outperformRate: sentimentSummary.outperformRate,
    recentHeadlines: sentimentSummary.recentHeadlines,
  };
  if (process.env.GEMINI_API_KEY) {
    try {
      const messages = await generateDiscussionWithGeminiFromAdvisors(
        symbol,
        sentimentSummary,
        advisors,
        { forUser: forUser || undefined }
      );
      return { messages, fromMock: false };
    } catch (err) {
      console.error("Gemini discussion error (e.g. rate limit or token limit):", err);
      return {
        messages: generateMockDiscussion(symbol, summary, advisors.map((a) => a.id)),
        fromMock: true,
      };
    }
  }
  return {
    messages: generateMockDiscussion(symbol, summary, advisors.map((a) => a.id)),
    fromMock: true,
  };
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
  const forUser = request.nextUrl.searchParams.get("forUser")?.trim() || null;
  try {
    let sentimentSummary: StockSentimentSummary;
    try {
      sentimentSummary = await getStockSentiment(symbol);
    } catch {
      sentimentSummary = getMockStockSentiment(symbol);
    }
    const advisors: AdvisorForDiscussion[] = advisorIds.map((id) => {
      const a = ADVISORS[id];
      return { id: a.id, name: a.name, title: a.title, instructions: a.instructions, discussionFocus: a.discussionFocus };
    });
    const { messages, fromMock } = await runDiscussion(symbol, sentimentSummary, advisors, forUser);
    return NextResponse.json({ symbol, messages, fromMock });
  } catch (err) {
    console.error("Discussion API error:", err);
    return NextResponse.json(
      { error: "Failed to generate discussion" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let body: { symbol?: string; advisors?: AdvisorForDiscussion[]; forUser?: string | null };
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
  const forUser = typeof body.forUser === "string" ? body.forUser.trim() || null : null;
  try {
    let sentimentSummary: StockSentimentSummary;
    try {
      sentimentSummary = await getStockSentiment(symbol);
    } catch {
      sentimentSummary = getMockStockSentiment(symbol);
    }
    const { messages, fromMock } = await runDiscussion(symbol, sentimentSummary, advisors, forUser);
    return NextResponse.json({ symbol, messages, fromMock });
  } catch (err) {
    console.error("Discussion API error:", err);
    return NextResponse.json(
      { error: "Failed to generate discussion" },
      { status: 500 }
    );
  }
}
