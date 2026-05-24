import { fetchFinnhubProfile } from "@/lib/services/finnhub-stock-service";

export type StockSearchResult = {
  ticker: string;
  companyName: string;
  exchange: string | null;
  sector: string | null;
  industry: string | null;
};

type FinnhubSearchResponse = {
  count?: number;
  result?: Array<{
    description?: string;
    displaySymbol?: string;
    symbol?: string;
    type?: string;
  }>;
};

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";

export async function searchFinnhubStocks(query: string): Promise<StockSearchResult[]> {
  const token = process.env.FINNHUB_API_KEY;
  const trimmed = query.trim();
  if (!token || trimmed.length < 1) return [];

  const url = new URL(`${FINNHUB_BASE_URL}/search`);
  url.searchParams.set("q", trimmed);
  url.searchParams.set("token", token);

  try {
    const response = await fetch(url, { next: { revalidate: 300 } });
    if (!response.ok) return [];
    const payload = (await response.json()) as FinnhubSearchResponse;
    const candidates = (payload.result ?? [])
      .filter((item) => item.symbol && item.description)
      .filter((item) => isLikelyUsCommonStock(item.symbol ?? "", item.type ?? ""))
      .slice(0, 12);

    const enriched = await Promise.all(
      candidates.map(async (item) => {
        const ticker = String(item.symbol ?? item.displaySymbol).toUpperCase();
        const profile = await fetchFinnhubProfile(ticker, token);
        return {
          ticker,
          companyName: profile?.name ?? item.description ?? ticker,
          exchange: profile?.exchange ?? null,
          sector: null,
          industry: profile?.finnhubIndustry ?? null
        };
      })
    );

    return enriched
      .filter((item) => item.exchange ? isNasdaqOrNyse(item.exchange) : isMajorUsBestEffort(item.ticker))
      .slice(0, 8);
  } catch {
    return [];
  }
}

function isLikelyUsCommonStock(symbol: string, type: string) {
  const normalizedSymbol = symbol.toUpperCase();
  const normalizedType = type.toLowerCase();
  if (normalizedSymbol.includes(".") || normalizedSymbol.includes(":")) return false;
  if (["FOREX", "CRYPTO", "INDEX"].some((item) => normalizedType.includes(item.toLowerCase()))) return false;
  return normalizedType.includes("common") || normalizedType.includes("equity") || normalizedType === "";
}

function isNasdaqOrNyse(exchange: string | null) {
  const normalized = String(exchange ?? "").toUpperCase();
  return normalized.includes("NASDAQ") || normalized.includes("NEW YORK STOCK EXCHANGE") || normalized.includes("NYSE");
}

function isMajorUsBestEffort(ticker: string) {
  return /^[A-Z]{1,5}$/.test(ticker);
}
