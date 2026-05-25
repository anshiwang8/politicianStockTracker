import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { calculateRanking } from "../src/lib/scoring";
import { mockCatalysts, mockFundamentals, mockMacro, mockPoliticians, mockStocks } from "../src/lib/mock-data";
import { fetchMockPrices } from "../src/lib/services/price-service";

const prisma = new PrismaClient();

async function main() {
  await prisma.rankingScore.deleteMany();
  await prisma.watchlist.deleteMany();
  await prisma.manualScoreAdjustment.deleteMany();
  await prisma.tradeDisclosure.deleteMany();
  await prisma.stockPrice.deleteMany();
  await prisma.stockFundamentals.deleteMany();
  await prisma.catalyst.deleteMany();
  await prisma.macroIndicator.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.politician.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);
  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: { email: "demo@example.com", passwordHash, name: "Demo Analyst" }
  });

  for (const item of mockPoliticians) {
    await prisma.politician.upsert({
      where: { id: item.name.toLowerCase().replaceAll(" ", "-") },
      update: item,
      create: { id: item.name.toLowerCase().replaceAll(" ", "-"), ...item }
    });
  }

  for (const item of mockStocks) {
    const stock = await prisma.stock.upsert({
      where: { ticker: item.ticker },
      update: item,
      create: item
    });

    const fundamentals = mockFundamentals[item.ticker as keyof typeof mockFundamentals];
    await prisma.stockFundamentals.upsert({
      where: { stockId_fiscalYear: { stockId: stock.id, fiscalYear: 2025 } },
      update: fundamentals,
      create: { stockId: stock.id, fiscalYear: 2025, ...fundamentals }
    });

    const prices = await fetchMockPrices(item.ticker);
    for (const price of prices) {
      await prisma.stockPrice.upsert({
        where: { stockId_date: { stockId: stock.id, date: price.date } },
        update: { close: price.close, volume: price.volume },
        create: { stockId: stock.id, ...price }
      });
    }
  }

  const now = new Date();

  for (const [ticker, title, category, score, notes] of mockCatalysts) {
    const stock = await prisma.stock.findUniqueOrThrow({ where: { ticker } });
    await prisma.catalyst.create({
      data: {
        stockId: stock.id,
        title,
        category,
        score,
        notes,
        expectedAt: new Date(now.getTime() + 45 * 86_400_000)
      }
    });
  }

  for (const [sector, label, value, score, notes] of mockMacro) {
    await prisma.macroIndicator.create({ data: { sector, label, value, score, notes } });
  }

  for (const ticker of ["NVDA", "MSFT"]) {
    const stock = await prisma.stock.findUniqueOrThrow({ where: { ticker } });
    await prisma.watchlist.upsert({
      where: { userId_stockId: { userId: user.id, stockId: stock.id } },
      update: {},
      create: { userId: user.id, stockId: stock.id, alertMinScore: 80 }
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
    await prisma.rankingScore.create({
      data: {
        stockId: stock.id,
        ...calculateRanking({ stock, trades, fundamentals, catalysts, macro, manualAdjustment })
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
