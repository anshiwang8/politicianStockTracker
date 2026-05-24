export type ChartTimeframe = "1D" | "5D" | "1M" | "6M" | "YTD" | "1Y" | "5Y" | "MAX";

export type ChartPoint = {
  date: string;
  close: number;
  volume: number;
  ma50: number | null;
  ma200: number | null;
};

export type YahooChartResult = {
  ticker: string;
  timeframe: ChartTimeframe;
  range: string;
  interval: string;
  points: ChartPoint[];
  source: "Yahoo Finance";
  fetchedAt: string;
};

const timeframeParams: Record<ChartTimeframe, { range: string; interval: string }> = {
  "1D": { range: "1d", interval: "5m" },
  "5D": { range: "5d", interval: "15m" },
  "1M": { range: "1mo", interval: "1d" },
  "6M": { range: "6mo", interval: "1d" },
  YTD: { range: "ytd", interval: "1d" },
  "1Y": { range: "1y", interval: "1d" },
  "5Y": { range: "5y", interval: "1wk" },
  MAX: { range: "max", interval: "1mo" }
};

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          close?: Array<number | null>;
          volume?: Array<number | null>;
        }>;
      };
    }>;
    error?: unknown;
  };
};

export function isChartTimeframe(value: string): value is ChartTimeframe {
  return value in timeframeParams;
}

export async function fetchYahooChartData(ticker: string, timeframe: ChartTimeframe): Promise<YahooChartResult | null> {
  const { range, interval } = timeframeParams[timeframe];
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker.toUpperCase())}?range=${range}&interval=${interval}`;

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 300 }
    });
    if (!response.ok) return null;

    const payload = (await response.json()) as YahooChartResponse;
    const result = payload.chart?.result?.[0];
    const timestamps = result?.timestamp ?? [];
    const quote = result?.indicators?.quote?.[0];
    const closes = quote?.close ?? [];
    const volumes = quote?.volume ?? [];
    const rawPoints = timestamps
      .map((timestamp, index) => ({
        date: new Date(timestamp * 1000).toISOString(),
        close: Number(closes[index]),
        volume: Number(volumes[index] ?? 0)
      }))
      .filter((point) => Number.isFinite(point.close));

    if (!rawPoints.length) return null;

    return {
      ticker: ticker.toUpperCase(),
      timeframe,
      range,
      interval,
      points: addMovingAverages(rawPoints),
      source: "Yahoo Finance",
      fetchedAt: new Date().toISOString()
    };
  } catch {
    return null;
  }
}

function addMovingAverages(prices: Array<{ date: string; close: number; volume: number }>): ChartPoint[] {
  return prices.map((price, index) => ({
    ...price,
    ma50: movingAverage(prices, index, 50),
    ma200: movingAverage(prices, index, 200)
  }));
}

function movingAverage(prices: Array<{ close: number }>, index: number, window: number) {
  if (index + 1 < window) return null;
  const values = prices.slice(index + 1 - window, index + 1).map((price) => price.close);
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
