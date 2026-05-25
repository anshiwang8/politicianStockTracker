import crypto from "node:crypto";
import type { Chamber, Party, TradeType } from "@prisma/client";

export type NormalizedCapitolTrade = {
  externalId: string;
  politicianName: string;
  party: Party;
  chamber: Chamber;
  state: string;
  ticker: string;
  companyName: string;
  sector: string | null;
  transactionType: TradeType;
  transactionDate: Date;
  disclosureDate: Date;
  amountRange: string;
  source: "CAPITOL_TRADES";
  sourceUrl: string;
  estimatedValueLow: number | null;
  estimatedValueHigh: number | null;
  rawPayload: unknown;
};

type CapitolTradeRow = {
  _txId?: string | number;
  _politicianId?: string;
  chamber?: string;
  issuer?: {
    issuerName?: string | null;
    issuerTicker?: string | null;
    sector?: string | null;
  } | null;
  politician?: {
    _stateId?: string | null;
    chamber?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    nickname?: string | null;
    party?: string | null;
  } | null;
  pubDate?: string | null;
  txDate?: string | null;
  txType?: string | null;
  value?: number | null;
};

const CAPITOL_TRADES_URL = "https://www.capitoltrades.com/trades";
const DEFAULT_PAGE_SIZE = 96;

export async function fetchRecentCapitolTrades(pageSize = DEFAULT_PAGE_SIZE): Promise<NormalizedCapitolTrade[]> {
  const url = new URL(CAPITOL_TRADES_URL);
  url.searchParams.set("pageSize", String(pageSize));

  console.log(`[capitol-trades] GET ${url.toString()}`);
  const response = await fetch(url, {
    headers: {
      accept: "text/html,application/xhtml+xml",
      "user-agent": "AnshiPoliticalStockTracker/1.0 (+public Capitol Trades page parser)"
    },
    next: { revalidate: 300 }
  });
  console.log(`[capitol-trades] status=${response.status}`);

  const body = await response.text();
  if (!response.ok) {
    console.error(`[capitol-trades] failed response=${body.slice(0, 1000)}`);
    throw new Error("Capitol Trades data unavailable. Try refresh again later.");
  }

  const rows = extractTradeRows(body);
  console.log(`[capitol-trades] fetched rows=${rows.length}`);
  if (!rows.length) {
    throw new Error("Capitol Trades data unavailable. Try refresh again later.");
  }

  const normalized = rows.map(normalizeCapitolTrade).filter((trade): trade is NormalizedCapitolTrade => Boolean(trade));
  console.log(`[capitol-trades] normalized trades=${normalized.length}`);
  if (!normalized.length) {
    throw new Error("Capitol Trades data unavailable. Try refresh again later.");
  }

  return normalized;
}

function extractTradeRows(html: string): CapitolTradeRow[] {
  const marker = '\\"data\\":[{\\"_issuerId\\"';
  const markerIndex = html.indexOf(marker);
  if (markerIndex === -1) {
    console.error("[capitol-trades] embedded data marker not found");
    return [];
  }

  const arrayStart = html.indexOf("[", markerIndex);
  if (arrayStart === -1) return [];

  const json = readJsonArray(html, arrayStart);
  if (!json) {
    console.error("[capitol-trades] could not read embedded trade array");
    return [];
  }

  try {
    const decodedJson = json.replaceAll('\\"', '"').replaceAll("\\u003e", ">");
    const parsed = JSON.parse(decodedJson) as CapitolTradeRow[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("[capitol-trades] could not parse embedded trade array", error);
    return [];
  }
}

function readJsonArray(input: string, start: number) {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < input.length; index += 1) {
    const char = input[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (char === "[") depth += 1;
    if (char === "]") {
      depth -= 1;
      if (depth === 0) return input.slice(start, index + 1);
    }
  }

  return null;
}

function normalizeCapitolTrade(row: CapitolTradeRow): NormalizedCapitolTrade | null {
  const ticker = normalizeTicker(row.issuer?.issuerTicker);
  if (!ticker) return null;

  const transactionDate = parseDate(row.txDate);
  const disclosureDate = parseDate(row.pubDate);
  if (!transactionDate || !disclosureDate) return null;

  const politicianName = normalizePoliticianName(row);
  const transactionType = normalizeTradeType(row.txType);
  const amountRange = formatAmountRange(row.value);
  const { low, high } = estimatedRangeFromValue(row.value);
  const companyName = row.issuer?.issuerName?.trim() || ticker;
  const externalId = String(row._txId ?? buildExternalId({ politicianName, ticker, transactionDate, disclosureDate, amountRange, transactionType }));

  return {
    externalId: `capitol-trades:${externalId}`,
    politicianName,
    party: normalizeParty(row.politician?.party),
    chamber: normalizeChamber(row.chamber ?? row.politician?.chamber),
    state: (row.politician?._stateId ?? "--").toUpperCase(),
    ticker,
    companyName,
    sector: normalizeSector(row.issuer?.sector),
    transactionType,
    transactionDate,
    disclosureDate,
    amountRange,
    source: "CAPITOL_TRADES",
    sourceUrl: `${CAPITOL_TRADES_URL}/${row._txId ?? ""}`,
    estimatedValueLow: low,
    estimatedValueHigh: high,
    rawPayload: row
  };
}

function normalizeTicker(value?: string | null) {
  const ticker = value?.split(":")[0]?.trim().toUpperCase();
  if (!ticker || ticker === "N/A") return null;
  return ticker.replace(/[^A-Z0-9.-]/g, "");
}

function normalizePoliticianName(row: CapitolTradeRow) {
  const first = row.politician?.nickname || row.politician?.firstName || "";
  const last = row.politician?.lastName || "";
  return `${first} ${last}`.trim() || "Unknown politician";
}

function normalizeSector(value?: string | null) {
  if (!value) return null;
  return value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function normalizeTradeType(value?: string | null): TradeType {
  const normalized = String(value ?? "").toLowerCase();
  if (normalized.includes("buy") || normalized.includes("purchase")) return "BUY";
  if (normalized.includes("sell") || normalized.includes("sale")) return "SELL";
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
  return String(value ?? "").toLowerCase().includes("senate") ? "SENATE" : "HOUSE";
}

function formatAmountRange(value?: number | null) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) return "Undisclosed";
  const low = Math.max(1_000, Math.round(amount * 0.67));
  const high = Math.round(amount * 1.33);
  return `${compactDollars(low)}-${compactDollars(high)}`;
}

function estimatedRangeFromValue(value?: number | null) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) return { low: null, high: null };
  return {
    low: Math.max(1_000, Math.round(amount * 0.67)),
    high: Math.round(amount * 1.33)
  };
}

function compactDollars(value: number) {
  if (value >= 1_000_000) return `$${trimNumber(value / 1_000_000)}M`;
  if (value >= 1_000) return `$${trimNumber(value / 1_000)}K`;
  return `$${value}`;
}

function trimNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function parseDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
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
