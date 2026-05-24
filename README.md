# Anshi's Political Stock Tracker

A polished MVP dashboard for monitoring legally public U.S. politician stock trade disclosures and ranking tickers with a blend of politician activity and stock fundamentals.

Mock data is used until live public disclosure and market-data APIs are connected.

## Stack

- Next.js + React + TypeScript
- Tailwind CSS
- Prisma + PostgreSQL
- Mock-first service adapters for disclosures, fundamentals, prices, SEC, news/catalysts, and macro data
- Server-sent events for near-real-time dashboard updates
- Recharts for performance charts

## Quick Start

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

3. Start PostgreSQL:

   ```bash
   docker compose up -d
   ```

   Or use your own PostgreSQL instance and update `DATABASE_URL` in `.env`.

4. Create tables and seed mock data:

   ```bash
   npm run prisma:migrate -- --name init
   npm run prisma:seed
   ```

5. Run the app:

   ```bash
   npm run dev
   ```

6. Optional background refresh worker:

   ```bash
   npm run worker:refresh
   ```

## Live Data Integration

The app is mock-first for politician disclosures, while stock detail pages can use Finnhub live market data. Swap service modules in `src/lib/services` to call live providers such as STOCK Act disclosure datasets, House/Senate disclosure feeds, SEC EDGAR, Finnhub, Alpha Vantage, Nasdaq Data Link, or news/research APIs. Keep API keys in `.env`.

## Legal And Safety Notes

Use only legally public information such as STOCK Act disclosures, House/Senate public filings, SEC filings, and licensed market data APIs. Disclosures are delayed, transaction amounts are reported in ranges, and this app is not financial advice.
