import { prisma } from "@/lib/prisma";
import { calculateRanking } from "@/lib/scoring";
import { getScoreWeights } from "@/lib/settings";
import { fetchPublicDisclosureRecords } from "@/lib/services/disclosure-service";

export async function refreshDisclosuresAndScores() {
  const disclosures = await fetchPublicDisclosureRecords();

  for (const disclosure of disclosures) {
    const politician = await prisma.politician.findFirst({ where: { name: disclosure.politicianName } });
    const stock = await prisma.stock.findUnique({ where: { ticker: disclosure.ticker } });
    if (!politician || !stock) continue;

    await prisma.tradeDisclosure.upsert({
      where: {
        id: `${politician.id}-${stock.id}-${disclosure.transactionDate.toISOString()}-${disclosure.tradeType}`
      },
      create: {
        id: `${politician.id}-${stock.id}-${disclosure.transactionDate.toISOString()}-${disclosure.tradeType}`,
        politicianId: politician.id,
        stockId: stock.id,
        ticker: stock.ticker,
        companyName: stock.companyName,
        tradeType: disclosure.tradeType,
        transactionDate: disclosure.transactionDate,
        disclosureDate: disclosure.disclosureDate,
        transactionSizeRange: disclosure.transactionSizeRange,
        estimatedValue: disclosure.estimatedValue,
        filingUrl: disclosure.filingUrl,
        source: disclosure.source,
        rawPayload: disclosure
      },
      update: {
        disclosureDate: disclosure.disclosureDate,
        estimatedValue: disclosure.estimatedValue,
        rawPayload: disclosure
      }
    });
  }

  const stocks = await prisma.stock.findMany();
  for (const stock of stocks) {
    const [trades, fundamentals, catalysts, macro, manualAdjustment] = await Promise.all([
      prisma.tradeDisclosure.findMany({ where: { stockId: stock.id }, include: { politician: true } }),
      prisma.stockFundamentals.findFirst({ where: { stockId: stock.id }, orderBy: { fiscalYear: "desc" } }),
      prisma.catalyst.findMany({ where: { stockId: stock.id } }),
      prisma.macroIndicator.findFirst({ where: { sector: stock.sector }, orderBy: { asOf: "desc" } }),
      prisma.manualScoreAdjustment.findFirst({ where: { stockId: stock.id }, orderBy: { updatedAt: "desc" } })
    ]);

    const score = calculateRanking({ stock, trades, fundamentals, catalysts, macro, manualAdjustment, weights: getScoreWeights() });
    await prisma.rankingScore.create({
      data: {
        stockId: stock.id,
        ...score
      }
    });
  }

  return { refreshedAt: new Date(), disclosureCount: disclosures.length };
}
