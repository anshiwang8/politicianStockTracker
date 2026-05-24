import { mockTrades } from "@/lib/mock-data";

export type PublicDisclosureRecord = {
  politicianName: string;
  ticker: string;
  tradeType: "BUY" | "SELL" | "EXCHANGE" | "OTHER";
  estimatedValue: number;
  transactionSizeRange: string;
  transactionDate: Date;
  disclosureDate: Date;
  source: "HOUSE" | "SENATE" | "STOCK_ACT_API" | "MANUAL";
  filingUrl: string;
};

export async function fetchPublicDisclosureRecords(): Promise<PublicDisclosureRecord[]> {
  const now = new Date();

  if (!process.env.POLITICIAN_DISCLOSURE_API_KEY) {
    return mockTrades.map(([politicianName, ticker, tradeType, estimatedValue, transactionSizeRange, txDays, disclosureDays, source]) => ({
      politicianName,
      ticker,
      tradeType,
      estimatedValue,
      transactionSizeRange,
      transactionDate: new Date(now.getTime() - txDays * 86_400_000),
      disclosureDate: new Date(now.getTime() - disclosureDays * 86_400_000),
      source,
      filingUrl: `https://example.com/public-disclosure/${source.toLowerCase()}/${ticker}`
    }));
  }

  throw new Error("Live disclosure adapter not configured yet. Add provider-specific code in disclosure-service.ts.");
}
