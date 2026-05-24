import { NextResponse } from "next/server";
import { fetchYahooChartData, isChartTimeframe } from "@/lib/services/yahoo-chart-service";

export async function GET(request: Request, { params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const timeframe = new URL(request.url).searchParams.get("timeframe") ?? "1Y";

  if (!isChartTimeframe(timeframe)) {
    return NextResponse.json({ error: "Unsupported timeframe" }, { status: 400 });
  }

  const chart = await fetchYahooChartData(ticker, timeframe);
  if (!chart) {
    return NextResponse.json({ error: "Chart data unavailable" }, { status: 503 });
  }

  return NextResponse.json(chart);
}
