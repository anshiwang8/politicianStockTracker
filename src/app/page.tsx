import { prisma } from "@/lib/prisma";
import DashboardClient from "@/components/DashboardClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [rankings, trades, watchlist, latestTrade] = await Promise.all([
    prisma.rankingScore.findMany({
      where: { stock: { disclosures: { some: {} } } },
      orderBy: [{ finalScore: "desc" }, { asOf: "desc" }],
      distinct: ["stockId"],
      include: { stock: { include: { catalysts: true } } },
      take: 10
    }),
    prisma.tradeDisclosure.findMany({
      orderBy: { disclosureDate: "desc" },
      include: { politician: true, stock: true },
      take: 30
    }),
    prisma.watchlist.findMany({ include: { stock: true }, take: 20 }),
    prisma.tradeDisclosure.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } })
  ]);

  return (
    <DashboardClient
      initialData={JSON.parse(JSON.stringify({ rankings, trades, watchlist, lastUpdated: rankings[0]?.asOf ?? new Date(), lastPoliticianDataUpdated: latestTrade?.updatedAt ?? null }))}
    />
  );
}
