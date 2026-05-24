import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const politician = await prisma.politician.findUnique({
    where: { id },
    include: {
      disclosures: {
        orderBy: { transactionDate: "desc" },
        include: { stock: { include: { scores: { orderBy: { asOf: "desc" }, take: 1 } } } }
      }
    }
  });

  if (!politician) return NextResponse.json({ error: "Politician not found" }, { status: 404 });
  return NextResponse.json(politician);
}
