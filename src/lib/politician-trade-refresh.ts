import { Prisma, type Chamber, type Party } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calculateRanking } from "@/lib/scoring";
import { getScoreWeights } from "@/lib/settings";
import { fetchRecentCapitolTrades, type NormalizedCapitolTrade } from "@/lib/services/capitol-trades-service";
import { fetchFinnhubStockBundle, type FinnhubBundle } from "@/lib/services/finnhub-stock-service";

const stockBundleCache = new Map<string, Promise<FinnhubBundle | null>>();

export async function refreshPoliticianTrades() {
  let trades: NormalizedCapitolTrade[] = [];
  stockBundleCache.clear();

  try {
    trades = await fetchRecentCapitolTrades();
  } catch (error) {
    console.error("[politician-refresh] Capitol Trades fetch failed", error);
    return {
      fetched: 0,
      created: 0,
      updated: 0,
      error: "Capitol Trades data unavailable. Try refresh again later.",
      refreshedAt: new Date()
    };
  }

  let created = 0;
  let updated = 0;
  const removedSampleRows = await prisma.tradeDisclosure.deleteMany({
    where: {
      externalId: null,
      source: { in: ["HOUSE", "SENATE", "MANUAL"] }
    }
  });
  if (removedSampleRows.count) {
    console.log(`[politician-refresh] removed legacy sample trades=${removedSampleRows.count}`);
  }

  for (const trade of trades) {
    const politician = await upsertPolitician(trade.politicianName, trade.party, trade.chamber, trade.state);
    const stock = await upsertStock(trade.ticker, trade.companyName, trade.sector);
    await upsertStockFundamentals(stock.id, trade.ticker);
    const existing = await prisma.tradeDisclosure.findUnique({ where: { externalId: trade.externalId } });

    await prisma.tradeDisclosure.upsert({
      where: { externalId: trade.externalId },
      create: {
        externalId: trade.externalId,
        politicianId: politician.id,
        stockId: stock.id,
        ticker: trade.ticker,
        companyName: trade.companyName,
        tradeType: trade.transactionType,
        transactionDate: trade.transactionDate,
        disclosureDate: trade.disclosureDate,
        transactionSizeRange: trade.amountRange,
        estimatedValue: midpoint(trade.estimatedValueLow, trade.estimatedValueHigh),
        estimatedValueLow: trade.estimatedValueLow,
        estimatedValueHigh: trade.estimatedValueHigh,
        filingUrl: trade.sourceUrl,
        source: trade.source,
        rawPayload: toJson(trade.rawPayload)
      },
      update: {
        politicianId: politician.id,
        stockId: stock.id,
        companyName: trade.companyName,
        tradeType: trade.transactionType,
        transactionDate: trade.transactionDate,
        disclosureDate: trade.disclosureDate,
        transactionSizeRange: trade.amountRange,
        estimatedValue: midpoint(trade.estimatedValueLow, trade.estimatedValueHigh),
        estimatedValueLow: trade.estimatedValueLow,
        estimatedValueHigh: trade.estimatedValueHigh,
        filingUrl: trade.sourceUrl,
        rawPayload: toJson(trade.rawPayload)
      }
    });

    if (existing) updated += 1;
    else created += 1;
  }

  await refreshRankingScores();
  console.log(`[politician-refresh] fetched=${trades.length} created=${created} updated=${updated}`);

  return { fetched: trades.length, created, updated, refreshedAt: new Date() };
}

async function upsertPolitician(name: string, party: Party, chamber: Chamber, state: string) {
  const existing = await prisma.politician.findFirst({ where: { name } });
  if (existing) {
    return prisma.politician.update({
      where: { id: existing.id },
      data: { party, chamber, state }
    });
  }

  return prisma.politician.create({
    data: { name, party, chamber, state, committees: [] }
  });
}

async function upsertStock(ticker: string, fallbackCompanyName: string, fallbackSector?: string | null) {
  const bundle = await getStockBundle(ticker);
  const profile = bundle?.profile;
  return prisma.stock.upsert({
    where: { ticker },
    create: {
      ticker,
      companyName: profile?.name ?? fallbackCompanyName,
      sector: fallbackSector ?? "Unknown",
      industry: profile?.finnhubIndustry ?? "Unknown",
      marketCap: profile?.marketCapitalization == null ? undefined : profile.marketCapitalization * 1_000_000
    },
    update: {
      companyName: profile?.name ?? fallbackCompanyName,
      industry: profile?.finnhubIndustry ?? undefined,
      marketCap: profile?.marketCapitalization == null ? undefined : profile.marketCapitalization * 1_000_000
    }
  });
}

async function upsertStockFundamentals(stockId: string, ticker: string) {
  const bundle = await getStockBundle(ticker);
  const metric = bundle?.metrics?.metric;
  if (!metric) return;

  await prisma.stockFundamentals.upsert({
    where: { stockId_fiscalYear: { stockId, fiscalYear: new Date().getFullYear() } },
    create: {
      stockId,
      fiscalYear: new Date().getFullYear(),
      revenueGrowthYoY: percent(metric.revenueGrowthTTMYoy ?? metric.revenueGrowthQuarterlyYoy),
      revenueCagr3Y: percent(metric.revenueGrowth3Y),
      netIncomeGrowthYoY: percent(metric.netIncomeGrowthTTMYoy ?? metric.netIncomeGrowthQuarterlyYoy),
      epsGrowthYoY: percent(metric.epsGrowthTTMYoy ?? metric.epsGrowthQuarterlyYoy),
      operatingIncomeGrowth: percent(metric.operatingIncomeGrowthTTMYoy),
      grossMargin: percent(metric.grossMarginTTM),
      operatingMargin: percent(metric.operatingMarginTTM),
      netMargin: percent(metric.netProfitMarginTTM),
      debtToEquity: number(metric.totalDebtToEquityAnnual ?? metric.totalDebtToEquityQuarterly),
      freeCashFlow: number(metric.fcfPerShareTTM) * number(bundle.quote?.c),
      operatingCashFlow: number(metric.operatingCashFlowPerShareTTM) * number(bundle.quote?.c),
      roic: percent(metric.roicTTM),
      priceToSales: number(metric.psTTM),
      priceToEarnings: number(metric.peTTM),
      forwardPriceToEarnings: number(metric.forwardPE),
      pegRatio: number(metric.pegRatio),
      rdToRevenue: percent(metric.rAndDToRevenueTTM)
    },
    update: {
      revenueGrowthYoY: percent(metric.revenueGrowthTTMYoy ?? metric.revenueGrowthQuarterlyYoy),
      revenueCagr3Y: percent(metric.revenueGrowth3Y),
      netIncomeGrowthYoY: percent(metric.netIncomeGrowthTTMYoy ?? metric.netIncomeGrowthQuarterlyYoy),
      epsGrowthYoY: percent(metric.epsGrowthTTMYoy ?? metric.epsGrowthQuarterlyYoy),
      operatingIncomeGrowth: percent(metric.operatingIncomeGrowthTTMYoy),
      grossMargin: percent(metric.grossMarginTTM),
      operatingMargin: percent(metric.operatingMarginTTM),
      netMargin: percent(metric.netProfitMarginTTM),
      debtToEquity: number(metric.totalDebtToEquityAnnual ?? metric.totalDebtToEquityQuarterly),
      freeCashFlow: number(metric.fcfPerShareTTM) * number(bundle.quote?.c),
      operatingCashFlow: number(metric.operatingCashFlowPerShareTTM) * number(bundle.quote?.c),
      roic: percent(metric.roicTTM),
      priceToSales: number(metric.psTTM),
      priceToEarnings: number(metric.peTTM),
      forwardPriceToEarnings: number(metric.forwardPE),
      pegRatio: number(metric.pegRatio),
      rdToRevenue: percent(metric.rAndDToRevenueTTM)
    }
  });
}

function getStockBundle(ticker: string) {
  const normalized = ticker.toUpperCase();
  if (!stockBundleCache.has(normalized)) {
    stockBundleCache.set(normalized, fetchFinnhubStockBundle(normalized));
  }
  return stockBundleCache.get(normalized)!;
}

async function refreshRankingScores() {
  const stocks = await prisma.stock.findMany({ where: { disclosures: { some: {} } } });
  for (const stock of stocks) {
    const [trades, fundamentals, catalysts, macro, manualAdjustment] = await Promise.all([
      prisma.tradeDisclosure.findMany({ where: { stockId: stock.id }, include: { politician: true } }),
      prisma.stockFundamentals.findFirst({ where: { stockId: stock.id }, orderBy: { fiscalYear: "desc" } }),
      prisma.catalyst.findMany({ where: { stockId: stock.id } }),
      prisma.macroIndicator.findFirst({ where: { sector: stock.sector }, orderBy: { asOf: "desc" } }),
      prisma.manualScoreAdjustment.findFirst({ where: { stockId: stock.id }, orderBy: { updatedAt: "desc" } })
    ]);

    await prisma.rankingScore.create({
      data: {
        stockId: stock.id,
        ...calculateRanking({ stock, trades, fundamentals, catalysts, macro, manualAdjustment, weights: getScoreWeights() })
      }
    });
  }
}

function midpoint(low: number | null, high: number | null) {
  if (low != null && high != null) return (low + high) / 2;
  return low ?? high ?? 0;
}

function number(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function percent(value: unknown) {
  const parsed = number(value);
  return Math.abs(parsed) > 1 ? parsed / 100 : parsed;
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
