import { Prisma, type Chamber, type Party } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calculateRanking } from "@/lib/scoring";
import { getScoreWeights } from "@/lib/settings";
import { fetchRecentCongressionalTrades, type NormalizedCongressTrade } from "@/lib/services/finnhub-congress-service";
import { fetchFinnhubProfile } from "@/lib/services/finnhub-stock-service";

const defaultSymbols = ["MSFT", "NVDA", "AAPL", "TSLA", "AMD", "PLTR", "JPM", "UNH", "RTX", "OKLO", "LLY"];

export async function refreshPoliticianTrades(symbols = defaultSymbols) {
  let trades: NormalizedCongressTrade[] = [];

  try {
    trades = await fetchRecentCongressionalTrades(symbols);
  } catch (error) {
    console.error("[politician-refresh] Finnhub congressional fetch failed", error);
    return { fetched: 0, created: 0, updated: 0, error: "Finnhub congressional data unavailable", refreshedAt: new Date() };
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
    const stock = await upsertStock(trade.ticker, trade.companyName);
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

async function upsertStock(ticker: string, fallbackCompanyName: string) {
  const profile = await fetchFinnhubProfile(ticker);
  return prisma.stock.upsert({
    where: { ticker },
    create: {
      ticker,
      companyName: profile?.name ?? fallbackCompanyName,
      sector: "Unknown",
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

async function refreshRankingScores() {
  const stocks = await prisma.stock.findMany();
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

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
