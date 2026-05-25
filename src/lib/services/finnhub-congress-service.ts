import crypto from "node:crypto";
import type { Chamber, Party, TradeType } from "@prisma/client";

export type NormalizedCongressTrade = {
  externalId: string;
  politicianName: string;
  party: Party;
  chamber: Chamber;
  state: string;
  ticker: string;
  companyName: string;
  transactionType: TradeType;
  transactionDate: Date;
  disclosureDate: Date;
  amountRange: string;
  source: "STOCK_ACT_API";
  sourceUrl: string;
  estimatedValueLow: number | null;
  estimatedValueHigh: number | null;
  rawPayload: unknown;
};

type FinnhubCongressResponse = {
  data?: Array<Record<string, unknown>>;
};

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
const DEFAULT_LOOKBACK_DAYS = 120;

export async function fetchRecentCongressionalTrades(symbols: string[], lookbackDays = DEFAULT_LOOKBACK_DAYS) {
  const token = process.env.FINNHUB_API_KEY;
  if (!token) throw new Error("FINNHUB_API_KEY is not configured");

  const uniqueSymbols = Array.from(new Set(symbols.map((symbol) => symbol.trim().toUpperCase()).filter(Boolean)));
  const to = new Date();
  const from = new Date(to.getTime() - lookbackDays * 86_400_000);
  const allTrades: NormalizedCongressTrade[] = [];
  let successfulResponses = 0;

  for (const symbol of uniqueSymbols) {
    const url = buildCongressUrl(symbol, from, to, token);
    console.log(`[finnhub-congress] GET ${redactToken(url)}`);

    try {
      const response = await fetch(url, { next: { revalidate: 300 } });
      console.log(`[finnhub-congress] ${symbol} status=${response.status}`);

      if (!response.ok) {
        const body = await safeBody(response);
        console.error(`[finnhub-congress] ${symbol} failed response=${body}`);
        continue;
      }

      successfulResponses += 1;
      const payload = (await response.json()) as FinnhubCongressResponse | Array<Record<string, unknown>>;
      const rows = Array.isArray(payload) ? payload : payload.data ?? [];
      console.log(`[finnhub-congress] ${symbol} fetched=${rows.length}`);

      for (const row of rows) {
        const normalized = normalizeCongressTrade(row, symbol);
        if (normalized) allTrades.push(normalized);
      }
    } catch (error) {
      console.error(`[finnhub-congress] ${symbol} request error`, error);
    }
  }

  console.log(`[finnhub-congress] normalized trades=${allTrades.length}`);
  if (uniqueSymbols.length && successfulResponses === 0) {
    throw new Error("Finnhub congressional trading endpoint unavailable for all requested symbols");
  }
  return allTrades;
}

function buildCongressUrl(symbol: string, from: Date, to: Date, token: string) {
  const url = new URL(`${FINNHUB_BASE_URL}/stock/congressional-trading`);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("from", from.toISOString().slice(0, 10));
  url.searchParams.set("to", to.toISOString().slice(0, 10));
  url.searchParams.set("token", token);
  return url;
}

function normalizeCongressTrade(row: Record<string, unknown>, fallbackTicker: string): NormalizedCongressTrade | null {
  const ticker = firstString(row, ["symbol", "ticker"])?.toUpperCase() ?? fallbackTicker;
  if (!ticker) return null;

  const politicianName =
    firstString(row, ["representative", "name", "politicianName", "owner", "firstName"]) ?? "Unknown politician";
  const companyName = firstString(row, ["companyName", "assetName", "securityName", "description"]) ?? ticker;
  const transactionDate = parseDate(firstValue(row, ["transactionDate", "transaction_date", "date"]));
  const disclosureDate = parseDate(firstValue(row, ["disclosureDate", "filingDate", "disclosure_date", "filedDate"]));
  if (!transactionDate || !disclosureDate) return null;

  const transactionType = normalizeTradeType(firstString(row, ["transactionType", "transaction", "type", "transactionCode"]));
  const amountRange = firstString(row, ["amount", "amountRange", "transactionAmount", "value"]) ?? "Undisclosed";
  const { low, high } = parseAmountRange(amountRange);
  const chamber = normalizeChamber(firstString(row, ["chamber", "branch", "office"]));
  const party = normalizeParty(firstString(row, ["party", "politicalParty"]));
  const state = firstString(row, ["state", "districtState"]) ?? parseState(firstString(row, ["district"])) ?? "--";
  const sourceUrl = firstString(row, ["sourceUrl", "filingUrl", "url"]) ?? "https://finnhub.io";
  const externalId = buildExternalId({
    politicianName,
    ticker,
    transactionDate,
    disclosureDate,
    amountRange,
    transactionType
  });

  return {
    externalId,
    politicianName,
    party,
    chamber,
    state,
    ticker,
    companyName,
    transactionType,
    transactionDate,
    disclosureDate,
    amountRange,
    source: "STOCK_ACT_API",
    sourceUrl,
    estimatedValueLow: low,
    estimatedValueHigh: high,
    rawPayload: row
  };
}

function buildExternalId(input: {
  politicianName: string;
  ticker: string;
  transactionDate: Date;
  disclosureDate: Date;
  amountRange: string;
  transactionType: TradeType;
}) {
  const raw = [
    input.politicianName,
    input.ticker,
    input.transactionDate.toISOString().slice(0, 10),
    input.disclosureDate.toISOString().slice(0, 10),
    input.amountRange,
    input.transactionType
  ].join("|");
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function parseAmountRange(value: string) {
  const numbers = value.match(/\$?[\d,]+/g)?.map((item) => Number(item.replace(/[$,]/g, ""))) ?? [];
  return {
    low: numbers[0] ?? null,
    high: numbers[1] ?? numbers[0] ?? null
  };
}

function normalizeTradeType(value?: string | null): TradeType {
  const normalized = String(value ?? "").toLowerCase();
  if (normalized.includes("purchase") || normalized.includes("buy") || normalized === "p") return "BUY";
  if (normalized.includes("sale") || normalized.includes("sell") || normalized === "s") return "SELL";
  if (normalized.includes("exchange")) return "EXCHANGE";
  return "OTHER";
}

function normalizeParty(value?: string | null): Party {
  const normalized = String(value ?? "").toLowerCase();
  if (normalized.startsWith("d")) return "DEMOCRAT";
  if (normalized.startsWith("r")) return "REPUBLICAN";
  if (normalized.startsWith("i")) return "INDEPENDENT";
  return "OTHER";
}

function normalizeChamber(value?: string | null): Chamber {
  const normalized = String(value ?? "").toLowerCase();
  return normalized.includes("sen") ? "SENATE" : "HOUSE";
}

function parseState(value?: string | null) {
  const match = String(value ?? "").match(/\b[A-Z]{2}\b/);
  return match?.[0] ?? null;
}

function parseDate(value: unknown) {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function firstString(row: Record<string, unknown>, keys: string[]) {
  const value = firstValue(row, keys);
  return value == null ? null : String(value);
}

function firstValue(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (row[key] != null && row[key] !== "") return row[key];
  }
  return null;
}

function redactToken(url: URL) {
  const redacted = new URL(url.toString());
  if (redacted.searchParams.has("token")) redacted.searchParams.set("token", "REDACTED");
  return redacted.toString();
}

async function safeBody(response: Response) {
  try {
    return await response.text();
  } catch {
    return "<unreadable>";
  }
}
