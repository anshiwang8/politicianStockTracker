export type FinnhubQuote = {
  c?: number;
  d?: number;
  dp?: number;
  h?: number;
  l?: number;
  o?: number;
  pc?: number;
  t?: number;
};

export type FinnhubProfile = {
  country?: string;
  currency?: string;
  exchange?: string;
  finnhubIndustry?: string;
  ipo?: string;
  logo?: string;
  marketCapitalization?: number;
  name?: string;
  phone?: string;
  shareOutstanding?: number;
  ticker?: string;
  weburl?: string;
};

export type FinnhubMetrics = {
  metric?: Record<string, number | string | null | undefined>;
  metricType?: string;
  series?: Record<string, unknown>;
  symbol?: string;
};

export type FinnhubNews = {
  category?: string;
  datetime?: number;
  headline?: string;
  id?: number;
  image?: string;
  related?: string;
  source?: string;
  summary?: string;
  url?: string;
};

export type FinnhubBundle = {
  quote: FinnhubQuote | null;
  profile: FinnhubProfile | null;
  metrics: FinnhubMetrics | null;
  news: FinnhubNews[];
  fetchedAt: string;
};

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";

export async function fetchFinnhubStockBundle(symbol: string): Promise<FinnhubBundle | null> {
  const token = process.env.FINNHUB_API_KEY;
  if (!token) return null;

  const normalizedSymbol = symbol.toUpperCase();

  try {
    const [quote, profile, metrics, companyNews, marketNews] = await Promise.all([
      finnhubFetch<FinnhubQuote>("/quote", token, { symbol: normalizedSymbol }),
      finnhubFetch<FinnhubProfile>("/stock/profile2", token, { symbol: normalizedSymbol }),
      finnhubFetch<FinnhubMetrics>("/stock/metric", token, { symbol: normalizedSymbol, metric: "all" }),
      finnhubFetch<FinnhubNews[]>("/company-news", token, {
        symbol: normalizedSymbol,
        from: new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10),
        to: new Date().toISOString().slice(0, 10)
      }),
      finnhubFetch<FinnhubNews[]>("/news", token, { category: "general" })
    ]);

    return {
      quote: quote && hasAnyValue(quote) ? quote : null,
      profile: profile && hasAnyValue(profile) ? profile : null,
      metrics: metrics && hasAnyValue(metrics.metric) ? metrics : null,
      news: mergeNews(companyNews, marketNews, normalizedSymbol),
      fetchedAt: new Date().toISOString()
    };
  } catch {
    return null;
  }
}

export async function fetchFinnhubProfile(symbol: string, token = process.env.FINNHUB_API_KEY ?? "") {
  if (!token) return null;
  const profile = await finnhubFetch<FinnhubProfile>("/stock/profile2", token, { symbol: symbol.toUpperCase() });
  return profile && hasAnyValue(profile) ? profile : null;
}

async function finnhubFetch<T>(endpoint: string, token: string, params: Record<string, string>): Promise<T | null> {
  const url = new URL(`${FINNHUB_BASE_URL}${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("token", token);

  const response = await fetch(url, { next: { revalidate: 300 } });
  if (!response.ok) return null;
  return response.json() as Promise<T>;
}

function mergeNews(companyNews: FinnhubNews[] | null, marketNews: FinnhubNews[] | null, symbol: string) {
  const relatedMarketNews = Array.isArray(marketNews)
    ? marketNews.filter((item) => String(item.related ?? "").toUpperCase().split(",").includes(symbol))
    : [];
  const merged = [...(Array.isArray(companyNews) ? companyNews : []), ...relatedMarketNews];
  const seen = new Set<string>();

  return merged
    .filter((item) => {
      const key = `${item.headline ?? ""}-${item.datetime ?? ""}`;
      if (!item.headline || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => Number(b.datetime ?? 0) - Number(a.datetime ?? 0))
    .slice(0, 5);
}

function hasAnyValue(value: unknown) {
  if (!value || typeof value !== "object") return false;
  return Object.values(value).some((item) => item !== null && item !== undefined && item !== "");
}
