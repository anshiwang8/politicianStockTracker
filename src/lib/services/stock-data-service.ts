import { prisma } from "@/lib/prisma";
import { fetchFinnhubStockBundle, type FinnhubMetrics } from "@/lib/services/finnhub-stock-service";
import { fetchYahooChartData, type ChartPoint, type ChartTimeframe } from "@/lib/services/yahoo-chart-service";

export type Timeframe = ChartTimeframe;

export type StockDetailPoint = ChartPoint;

export type StockDetailNews = {
  headline: string;
  category: string;
  source: string;
  publishedAt: string;
  url?: string;
};

export type StockDetailBasics = {
  description: string | null;
  products: string[];
  competitors: string[];
  headquarters: string | null;
  ceo: string | null;
  website: string | null;
};

export type StockDetailRating = {
  label: "BUY" | "HOLD" | "SELL";
  score: number;
  explanation: string;
  components: Array<{ label: string; score: number; note: string }>;
};

export type StockDetail = {
  stockId: string | null;
  sourceLabel: "Live Finnhub data" | "Live market data unavailable";
  marketDataAvailable: boolean;
  marketDataLastUpdated: string | null;
  ticker: string;
  companyName: string;
  currentPrice: number | null;
  marketCap: number | null;
  volume: number | null;
  averageVolume: number | null;
  floatShares: number | null;
  shortInterest: number | null;
  week52High: number | null;
  week52Low: number | null;
  sector: string | null;
  industry: string | null;
  fundamentals: {
    revenue: number | null;
    netIncome: number | null;
    freeCashFlow: number | null;
    grossMargin: number | null;
    revenueGrowthYoY: number | null;
    eps: number | null;
    cash: number | null;
    debt: number | null;
    profitMargin: number | null;
    debtToEquity: number | null;
    peRatio: number | null;
  };
  prices: StockDetailPoint[];
  rating: StockDetailRating;
  basics: StockDetailBasics;
  news: StockDetailNews[];
  trades: Array<{
    id: string;
    politicianName: string;
    party: string;
    chamber: string;
    state: string;
    tradeType: string;
    transactionDate: string;
    disclosureDate: string;
    transactionSizeRange: string;
    estimatedValue: number;
    source: string;
  }>;
  tradeSummary: {
    totalBuyActivity: number;
    totalSellActivity: number;
    mostRecentTrade: string | null;
    netSentiment: "More buying" | "More selling" | "Balanced";
  };
  risks: Array<{ label: string; active: boolean; detail: string }>;
};

export async function getStockDetail(ticker: string): Promise<StockDetail | null> {
  const normalizedTicker = ticker.toUpperCase();
  const live = await fetchFinnhubStockBundle(normalizedTicker);
  const chart = await fetchYahooChartData(normalizedTicker, "1Y");
  const stock = await prisma.stock.findUnique({
    where: { ticker: normalizedTicker },
    include: {
      disclosures: { include: { politician: true }, orderBy: { transactionDate: "desc" } },
      scores: { orderBy: { asOf: "desc" }, take: 1 }
    }
  });

  if (!stock && !live?.quote && !live?.profile && !live?.metrics) return null;

  const disclosures = stock?.disclosures ?? [];
  const score = stock?.scores[0] ?? null;
  const metric = live?.metrics?.metric ?? {};
  const prices = chart?.points ?? [];
  const currentPrice = numberOrNull(live?.quote?.c);
  const latestVolume = prices.at(-1)?.volume ?? null;
  const averageVolume = firstMetric(metric, [
    "10DayAverageTradingVolume",
    "3MonthAverageTradingVolume",
    "averageVolume",
    "avgVolume"
  ]);
  const marketCapMillions = numberOrNull(live?.profile?.marketCapitalization);
  const marketCap = marketCapMillions == null ? firstMetric(metric, ["marketCapitalization"]) : marketCapMillions * 1_000_000;
  const shareOutstandingMillions = numberOrNull(live?.profile?.shareOutstanding);
  const revenueGrowth = firstMetric(metric, ["revenueGrowthTTMYoy", "revenueGrowth5Y", "revenueGrowth3Y"]);
  const peRatio = firstMetric(metric, ["peBasicExclExtraTTM", "peNormalizedAnnual", "peTTM"]);
  const profitMargin = firstMetric(metric, ["netProfitMarginTTM", "netProfitMarginAnnual"]);
  const debtToEquity = firstMetric(metric, [
    "totalDebt/totalEquityAnnual",
    "totalDebt/totalEquityQuarterly",
    "ltDebt/equityAnnual",
    "ltDebt/equityQuarterly"
  ]);
  const buyTotal = disclosures.filter((trade) => trade.tradeType === "BUY").reduce((sum, trade) => sum + Number(trade.estimatedValue), 0);
  const sellTotal = disclosures.filter((trade) => trade.tradeType === "SELL").reduce((sum, trade) => sum + Number(trade.estimatedValue), 0);
  const marketDataAvailable = Boolean(live?.quote || live?.profile || live?.metrics || prices.length);
  const rating = buildRating({
    politicianScore: score?.politicianActivityScore ?? 50,
    insiderScore: 50,
    revenueGrowth,
    priceTrend: scorePriceTrend(prices),
    valuationScore: scoreValuation(peRatio, revenueGrowth),
    volumeMomentum: scoreVolumeMomentum(prices),
    newsScore: live?.news?.length ? 62 : 50
  });

  return {
    stockId: stock?.id ?? null,
    sourceLabel: marketDataAvailable ? "Live Finnhub data" : "Live market data unavailable",
    marketDataAvailable,
    marketDataLastUpdated: marketDataAvailable ? live?.fetchedAt ?? new Date().toISOString() : null,
    ticker: normalizedTicker,
    companyName: live?.profile?.name ?? stock?.companyName ?? normalizedTicker,
    currentPrice,
    marketCap,
    volume: latestVolume,
    averageVolume: averageVolume == null ? null : averageVolume * 1_000_000,
    floatShares: shareOutstandingMillions == null ? null : shareOutstandingMillions * 1_000_000,
    shortInterest: firstMetric(metric, ["shortInterest", "shortInterestFloat", "shortInterestRatio"]),
    week52High: firstMetric(metric, ["52WeekHigh"]) ?? maxPrice(prices),
    week52Low: firstMetric(metric, ["52WeekLow"]) ?? minPrice(prices),
    sector: stock?.sector ?? null,
    industry: live?.profile?.finnhubIndustry ?? stock?.industry ?? null,
    fundamentals: {
      revenue: firstMetric(metric, ["revenueTTM", "revenuePerShareTTM"], { perShareBase: shareOutstandingMillions }),
      netIncome: firstMetric(metric, ["netIncomeTTM"]),
      freeCashFlow: firstMetric(metric, ["freeCashFlowTTM", "fcfTTM"]),
      grossMargin: firstMetric(metric, ["grossMarginTTM", "grossMarginAnnual"]),
      revenueGrowthYoY: revenueGrowth,
      eps: firstMetric(metric, ["epsBasicExclExtraItemsTTM", "epsNormalizedAnnual"]),
      cash: firstMetric(metric, ["cashAndShortTermInvestmentsAnnual", "cashAndShortTermInvestmentsQuarterly"]),
      debt: firstMetric(metric, ["totalDebtAnnual", "totalDebtQuarterly"]),
      profitMargin,
      debtToEquity,
      peRatio
    },
    prices,
    rating,
    basics: {
      description: live?.profile?.name ? `${live.profile.name} is listed on ${live.profile.exchange ?? "its primary exchange"} and is classified by Finnhub in ${live.profile.finnhubIndustry ?? "its reported industry"}.` : null,
      products: [],
      competitors: [],
      headquarters: live?.profile?.country ?? null,
      ceo: null,
      website: live?.profile?.weburl ?? null
    },
    news: Array.isArray(live?.news)
      ? live.news.slice(0, 5).map((item) => ({
          headline: item.headline ?? "Untitled market update",
          category: classifyHeadline(item.headline ?? item.category),
          source: item.source ?? "Finnhub",
          publishedAt: item.datetime ? new Date(item.datetime * 1000).toISOString() : new Date().toISOString(),
          url: item.url
        }))
      : [],
    trades: disclosures.map((trade) => ({
      id: trade.id,
      politicianName: trade.politician.name,
      party: trade.politician.party,
      chamber: trade.politician.chamber,
      state: trade.politician.state,
      tradeType: trade.tradeType,
      transactionDate: trade.transactionDate.toISOString(),
      disclosureDate: trade.disclosureDate.toISOString(),
      transactionSizeRange: trade.transactionSizeRange,
      estimatedValue: Number(trade.estimatedValue),
      source: trade.source
    })),
    tradeSummary: {
      totalBuyActivity: buyTotal,
      totalSellActivity: sellTotal,
      mostRecentTrade: disclosures[0]?.transactionDate.toISOString() ?? null,
      netSentiment: buyTotal > sellTotal * 1.1 ? "More buying" : sellTotal > buyTotal * 1.1 ? "More selling" : "Balanced"
    },
    risks: buildRisks({
      valuationScore: rating.components.find((item) => item.label === "Valuation")?.score ?? 50,
      debtToEquity,
      revenueGrowth,
      sellTotal,
      buyTotal,
      marketDataAvailable
    })
  };
}

function average(values: number[]) {
  const filtered = values.filter((value) => Number.isFinite(value));
  return filtered.length ? filtered.reduce((sum, value) => sum + value, 0) / filtered.length : 0;
}

function scorePriceTrend(prices: StockDetailPoint[]) {
  if (prices.length < 2) return 50;
  const recent = prices.at(-1)?.close ?? 0;
  const past = prices.at(-30)?.close ?? prices[0]?.close ?? recent;
  return clamp(50 + ((recent - past) / Math.max(1, past)) * 180);
}

function scoreVolumeMomentum(prices: StockDetailPoint[]) {
  if (prices.length < 10) return 50;
  const recent = average(prices.slice(-5).map((price) => price.volume));
  const baseline = average(prices.slice(-60, -5).map((price) => price.volume));
  return clamp(50 + ((recent - baseline) / Math.max(1, baseline)) * 45);
}

function scoreValuation(peRatio: number | null, revenueGrowth: number | null) {
  if (peRatio == null || peRatio <= 0) return 50;
  const growthOffset = revenueGrowth != null && revenueGrowth > 0.2 ? 10 : 0;
  return clamp(82 - Math.max(0, peRatio - 25) * 1.2 + growthOffset);
}

function buildRating(input: {
  politicianScore: number;
  insiderScore: number;
  revenueGrowth: number | null;
  priceTrend: number;
  valuationScore: number;
  volumeMomentum: number;
  newsScore: number;
}): StockDetailRating {
  const revenueGrowthScore = input.revenueGrowth == null ? 50 : clamp(45 + input.revenueGrowth * 140);
  const components = [
    { label: "Politician buying", score: input.politicianScore, note: "Recent public disclosure activity." },
    { label: "Insider/institutional activity", score: input.insiderScore, note: "Finnhub endpoints configured here do not include insider/institutional feeds." },
    { label: "Revenue growth", score: revenueGrowthScore, note: "Calculated from Finnhub company metrics." },
    { label: "Price trend", score: input.priceTrend, note: "Calculated from Yahoo Finance chart data." },
    { label: "Valuation", score: input.valuationScore, note: "Uses Finnhub P/E and growth context." },
    { label: "Volume momentum", score: input.volumeMomentum, note: "Compares recent Yahoo Finance volume to baseline volume." },
    { label: "News/sentiment", score: input.newsScore, note: "Uses recent Finnhub market and company news availability." }
  ];
  const score = clamp(
    input.politicianScore * 0.25 +
      input.insiderScore * 0.1 +
      revenueGrowthScore * 0.18 +
      input.priceTrend * 0.14 +
      input.valuationScore * 0.13 +
      input.volumeMomentum * 0.08 +
      input.newsScore * 0.12
  );
  const label = score >= 80 ? "BUY" : score >= 60 ? "HOLD" : "SELL";
  const positive = components.filter((item) => item.score >= 65).sort((a, b) => b.score - a.score)[0]?.label.toLowerCase() ?? "the setup";
  const negative = components.filter((item) => item.score < 55).sort((a, b) => a.score - b.score)[0]?.label.toLowerCase();

  return {
    label,
    score,
    explanation: negative
      ? `${capitalize(positive)} is supportive, but ${negative} is a concern.`
      : `${capitalize(positive)} and the overall scoring mix support the ${label.toLowerCase()} rating.`,
    components
  };
}

function buildRisks(input: {
  valuationScore: number;
  debtToEquity: number | null;
  revenueGrowth: number | null;
  sellTotal: number;
  buyTotal: number;
  marketDataAvailable: boolean;
}) {
  return [
    { label: "Overvaluation", active: input.valuationScore < 55, detail: "Valuation score is below the neutral threshold." },
    { label: "High debt", active: (input.debtToEquity ?? 0) > 1.4, detail: "Debt-to-equity is elevated versus the model threshold." },
    { label: "Declining revenue", active: (input.revenueGrowth ?? 0) < 0, detail: "Latest YoY revenue growth is negative." },
    { label: "Heavy insider selling", active: input.sellTotal > input.buyTotal * 1.5, detail: "Public politician sell activity is materially above buy activity." },
    { label: "Delayed political disclosures", active: true, detail: "Public politician disclosures can arrive days or weeks after trades." },
    { label: "Market data unavailable", active: !input.marketDataAvailable, detail: "Finnhub did not return live market data for this ticker." }
  ];
}

function firstMetric(metric: FinnhubMetrics["metric"], keys: string[], options?: { perShareBase?: number | null }) {
  for (const key of keys) {
    const value = numberOrNull(metric?.[key]);
    if (value == null) continue;
    if (key.toLowerCase().includes("pershare") && options?.perShareBase) {
      return value * options.perShareBase * 1_000_000;
    }
    return value;
  }
  return null;
}

function maxPrice(prices: StockDetailPoint[]) {
  return prices.length ? Math.max(...prices.map((price) => price.close)) : null;
}

function minPrice(prices: StockDetailPoint[]) {
  return prices.length ? Math.min(...prices.map((price) => price.close)) : null;
}

function numberOrNull(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function classifyHeadline(title?: string) {
  const normalized = String(title ?? "").toLowerCase();
  if (normalized.includes("earnings") || normalized.includes("revenue")) return "Earnings";
  if (normalized.includes("launch") || normalized.includes("product")) return "Product";
  if (normalized.includes("lawsuit") || normalized.includes("regulation")) return "Regulation";
  if (normalized.includes("contract") || normalized.includes("deal")) return "Contract";
  if (normalized.includes("upgrade") || normalized.includes("downgrade") || normalized.includes("analyst")) return "Analyst";
  return "News";
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
