# Portfolio Pilot

**Multi-agent stock advisory platform** — Get debate-style analysis from AI personas of famous investors (Buffett, Lynch, Dalio, Graham, Cathie Wood) with real-time sentiment and historical sentiment-vs-performance metrics.

Built for hackathon demo. Sentiment and discussion use mock data; plug in News API, Alpha Vantage, and an LLM for production.

## Features

- **Advisory panel**: Warren Buffett, Peter Lynch, Ray Dalio, Benjamin Graham, Cathie Wood as distinct agents with their real-world philosophies in the instructions.
- **Discussion**: Agents discuss pros and cons of a stock; messages stream in for a live feel.
- **Real-time sentiment**: Gauge and recent headlines (mock; replace with news sentiment API).
- **Historical comparison**: Chart of sentiment vs actual return and **outperform rate** — % of periods the stock beat its sentiment-implied return.

## Run locally

1. Copy `.env.example` to `.env.local` and add your Gemini API key:
   ```
   GEMINI_API_KEY=your-key
   ```
   Get a key at [Google AI Studio](https://aistudio.google.com/apikey).
2. Install and run:
   ```bash
   npm install
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000), enter a ticker (e.g. AAPL), and click **Analyze**.

If `GEMINI_API_KEY` is not set, the app falls back to mock advisor responses.

## Stack

- Next.js 14 (App Router), React, TypeScript
- Tailwind CSS, Recharts, Lucide icons
- Mock APIs under `/api/sentiment` and `/api/discussion`

## Production roadmap

- Wire **News API** (or similar) for real headline sentiment.
- Use **Alpha Vantage** or **Polygon** for historical prices and returns.
- Replace mock discussion with **LLM calls** (OpenAI/Anthropic) using each advisor’s `instructions` and current sentiment/performance context.
