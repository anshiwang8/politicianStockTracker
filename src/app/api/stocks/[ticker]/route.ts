import { NextResponse } from "next/server";
import { getStockDetail } from "@/lib/services/stock-data-service";

export async function GET(_: Request, { params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const detail = await getStockDetail(ticker);

  if (!detail) return NextResponse.json({ error: "Stock not found" }, { status: 404 });
  return NextResponse.json(detail);
}
