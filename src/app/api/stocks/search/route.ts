import { NextResponse } from "next/server";
import { searchFinnhubStocks } from "@/lib/services/stock-search-service";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  if (!query.trim()) return NextResponse.json({ results: [] });

  const results = await searchFinnhubStocks(query);
  return NextResponse.json({ results });
}
