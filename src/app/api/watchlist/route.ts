import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { stockId, ticker, companyName, sector, industry, userEmail = "demo@example.com", alertMinScore = 80 } = await request.json();
  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) return NextResponse.json({ error: "Demo user not found" }, { status: 404 });
  const normalizedTicker = String(ticker ?? "").trim().toUpperCase();
  const stock = stockId
    ? await prisma.stock.findUnique({ where: { id: stockId } })
    : normalizedTicker
      ? await prisma.stock.upsert({
          where: { ticker: normalizedTicker },
          create: {
            ticker: normalizedTicker,
            companyName: companyName ?? normalizedTicker,
            sector: sector ?? "Unknown",
            industry: industry ?? "Unknown"
          },
          update: {
            companyName: companyName ?? undefined,
            sector: sector ?? undefined,
            industry: industry ?? undefined
          }
        })
      : null;

  if (!stock) return NextResponse.json({ error: "Stock not found" }, { status: 404 });

  const watchlist = await prisma.watchlist.upsert({
    where: { userId_stockId: { userId: user.id, stockId: stock.id } },
    create: { userId: user.id, stockId: stock.id, alertMinScore },
    update: { alertMinScore }
  });

  return NextResponse.json(watchlist);
}
