import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const adjustment = await prisma.manualScoreAdjustment.create({
    data: {
      stockId: body.stockId,
      moatScore: body.moatScore,
      managementScore: body.managementScore,
      catalystScore: body.catalystScore,
      macroScore: body.macroScore,
      notes: body.notes,
      updatedBy: body.updatedBy ?? "demo@example.com"
    }
  });

  return NextResponse.json(adjustment);
}
