"use client";

import { useEffect, useState } from "react";
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/Badge";
import type { StockDetail, Timeframe } from "@/lib/services/stock-data-service";

const timeframes: Timeframe[] = ["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y", "MAX"];

export function StockDetailClient({ detail }: { detail: StockDetail }) {
  const [timeframe, setTimeframe] = useState<Timeframe>("1Y");
  const [chartPrices, setChartPrices] = useState(formatChartLabels(detail.prices, "1Y"));
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState(detail.prices.length ? "" : "Chart data unavailable");
  const [watchlistState, setWatchlistState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timeframeChange = getPercentChange(chartPrices);
  const ratingTone = detail.rating.label === "BUY" ? "green" : detail.rating.label === "HOLD" ? "gold" : "red";

  useEffect(() => {
    let cancelled = false;

    async function loadChart() {
      setChartLoading(true);
      setChartError("");
      try {
        const response = await fetch(`/api/stocks/${encodeURIComponent(detail.ticker)}/chart?timeframe=${timeframe}`);
        if (!response.ok) throw new Error("Chart data unavailable");
        const payload = await response.json() as { points?: StockDetail["prices"] };
        const points = payload.points ?? [];
        if (!points.length) throw new Error("Chart data unavailable");
        if (!cancelled) setChartPrices(formatChartLabels(points, timeframe));
      } catch {
        if (!cancelled) {
          setChartPrices([]);
          setChartError("Chart data unavailable");
        }
      } finally {
        if (!cancelled) setChartLoading(false);
      }
    }

    loadChart();
    return () => {
      cancelled = true;
    };
  }, [detail.ticker, timeframe]);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-line bg-white p-5 shadow-panel">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="blue">{detail.sector}</Badge>
              <Badge>{detail.industry}</Badge>
              <Badge tone={detail.marketDataAvailable ? "green" : "red"}>{detail.sourceLabel}</Badge>
            </div>
            <h1 className="mt-2 text-3xl font-bold">
              {detail.ticker} / {detail.companyName}
            </h1>
            <div className="mt-3 flex flex-wrap items-baseline gap-4">
              <span className="text-3xl font-bold">{formatCurrency(detail.currentPrice)}</span>
              <span className={timeframeChange >= 0 ? "font-semibold text-emerald-700" : "font-semibold text-rose-700"}>
                {timeframeChange >= 0 ? "+" : ""}
                {timeframeChange.toFixed(2)}% {timeframe}
              </span>
            </div>
            <p className="mt-3 max-w-3xl text-sm text-slate-600">{detail.rating.explanation}</p>
            <div className="mt-2 text-xs font-semibold text-slate-500">
              Market data last updated: {detail.marketDataLastUpdated ? new Date(detail.marketDataLastUpdated).toLocaleString() : "unavailable"}
            </div>
          </div>
          <div className="rounded-lg border border-line bg-paper px-5 py-4 text-center">
            <Badge tone={ratingTone}>{detail.rating.label}</Badge>
            <div className="mt-2 text-3xl font-bold">{Math.round(detail.rating.score)}</div>
            <div className="text-xs text-slate-500">rating score</div>
            <button
              className="mt-4 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold hover:border-accent"
              disabled={watchlistState === "saving"}
              onClick={async () => {
                setWatchlistState("saving");
                const response = await fetch("/api/watchlist", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    stockId: detail.stockId,
                    ticker: detail.ticker,
                    companyName: detail.companyName,
                    sector: detail.sector,
                    industry: detail.industry
                  })
                });
                setWatchlistState(response.ok ? "saved" : "error");
              }}
              type="button"
            >
              {watchlistState === "saving" ? "Adding..." : watchlistState === "saved" ? "Added" : "Add to watchlist"}
            </button>
            {watchlistState === "error" ? <div className="mt-2 text-xs font-semibold text-rose-700">Unable to add</div> : null}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white p-5 shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Price Performance</h2>
          <div className="flex flex-wrap gap-1">
            {timeframes.map((item) => (
              <button
                key={item}
                className={item === timeframe ? "rounded border border-accent bg-cyan-50 px-3 py-1.5 text-sm font-semibold text-accent" : "rounded border border-line bg-white px-3 py-1.5 text-sm font-semibold hover:border-accent"}
                onClick={() => setTimeframe(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        {chartLoading ? (
          <EmptyState title="Loading chart data" body="Fetching the selected Yahoo Finance range." />
        ) : chartPrices.length ? (
          <div className="mt-4 h-[390px]">
            <ResponsiveContainer>
              <ComposedChart data={chartPrices} margin={{ left: 4, right: 12, top: 8, bottom: 0 }}>
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={24} />
                <YAxis yAxisId="price" tick={{ fontSize: 11 }} domain={["dataMin - 5", "dataMax + 5"]} />
                <YAxis yAxisId="volume" orientation="right" tick={{ fontSize: 11 }} hide />
                <Tooltip formatter={(value, name) => formatTooltip(value, String(name))} />
                <Bar yAxisId="volume" dataKey="volume" fill="#d8dee9" opacity={0.55} name="Volume" />
                <Line yAxisId="price" type="monotone" dataKey="close" stroke="#0f766e" strokeWidth={2.5} dot={false} name="Close" />
                <Line yAxisId="price" type="monotone" dataKey="ma50" stroke="#b45309" strokeWidth={1.6} dot={false} connectNulls name="50-day MA" />
                <Line yAxisId="price" type="monotone" dataKey="ma200" stroke="#64748b" strokeWidth={1.6} dot={false} connectNulls name="200-day MA" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState title="Chart data unavailable" body={chartError || "Yahoo Finance did not return chart data for this ticker."} />
        )}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-line bg-white p-5 shadow-panel">
          <h2 className="text-lg font-bold">Quick Stats</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <MiniStat label="Current price" value={formatCurrency(detail.currentPrice)} />
            <MiniStat label="Market cap" value={formatLarge(detail.marketCap)} />
            <MiniStat label="Volume" value={formatLarge(detail.volume)} />
            <MiniStat label="Average volume" value={formatLarge(detail.averageVolume)} />
            <MiniStat label="Float" value={formatLarge(detail.floatShares)} />
            <MiniStat label="Short interest" value={detail.shortInterest == null ? "n/a" : `${detail.shortInterest.toFixed(1)}%`} />
            <MiniStat label="52-week high" value={formatCurrency(detail.week52High)} />
            <MiniStat label="52-week low" value={formatCurrency(detail.week52Low)} />
            <MiniStat label="P/E ratio" value={formatNumber(detail.fundamentals.peRatio)} />
            <MiniStat label="Revenue growth" value={formatPercent(detail.fundamentals.revenueGrowthYoY)} />
            <MiniStat label="Profit margin" value={formatPercent(detail.fundamentals.profitMargin)} />
            <MiniStat label="Debt-to-equity" value={formatNumber(detail.fundamentals.debtToEquity)} />
          </div>
        </div>

        <aside className="rounded-lg border border-line bg-white p-5 shadow-panel">
          <h2 className="text-lg font-bold">Rating Model</h2>
          <div className="mt-4 space-y-3">
            {detail.rating.components.map((component) => (
              <div key={component.label}>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-semibold">{component.label}</span>
                  <span>{Math.round(component.score)}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-accent" style={{ width: `${component.score}%` }} />
                </div>
                <p className="mt-1 text-xs text-slate-500">{component.note}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="rounded-lg border border-line bg-white p-5 shadow-panel">
        <h2 className="text-lg font-bold">Politician Trade Activity</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MiniStat label="Total estimated buys" value={formatCurrency(detail.tradeSummary.totalBuyActivity)} />
          <MiniStat label="Total estimated sells" value={formatCurrency(detail.tradeSummary.totalSellActivity)} />
          <MiniStat label="Most recent trade" value={detail.tradeSummary.mostRecentTrade ? new Date(detail.tradeSummary.mostRecentTrade).toLocaleDateString() : "n/a"} />
          <MiniStat label="Net sentiment" value={detail.tradeSummary.netSentiment} />
        </div>
        <div className="mt-4 max-h-[420px] overflow-auto rounded-lg border border-line">
          {detail.trades.length ? (
            <table className="w-full min-w-[900px] table-fixed border-collapse text-sm">
              <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="w-[220px] px-4 py-3">Politician</th>
                  <th className="w-[150px] px-4 py-3">Party</th>
                  <th className="w-[120px] px-4 py-3">Trade date</th>
                  <th className="w-[130px] px-4 py-3">Disclosure</th>
                  <th className="w-[90px] px-4 py-3">Type</th>
                  <th className="w-[170px] px-4 py-3">Amount range</th>
                  <th className="w-[90px] px-4 py-3">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {detail.trades.map((trade) => (
                  <tr key={trade.id}>
                    <td className="px-4 py-3 font-semibold">{trade.politicianName}</td>
                    <td className="px-4 py-3 text-slate-600">{trade.party} / {trade.chamber} / {trade.state}</td>
                    <td className="px-4 py-3">{new Date(trade.transactionDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{new Date(trade.disclosureDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3"><Badge tone={trade.tradeType === "BUY" ? "green" : "red"}>{trade.tradeType}</Badge></td>
                    <td className="px-4 py-3">{trade.transactionSizeRange}</td>
                    <td className="px-4 py-3">{trade.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState title="No recent politician trades found." body="Live stock data is still available for tickers without congressional disclosure records." />
          )}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-line bg-white p-5 shadow-panel">
          <h2 className="text-lg font-bold">Company Basics</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">{detail.basics.description ?? "Company description unavailable from Finnhub."}</p>
          <InfoList label="Main products/services" values={detail.basics.products} />
          <InfoList label="Top competitors" values={detail.basics.competitors} />
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <MiniStat label="Headquarters" value={detail.basics.headquarters ?? "Unavailable"} />
            <MiniStat label="CEO" value={detail.basics.ceo ?? "Unavailable"} />
            <MiniStat label="Website" value={detail.basics.website ? detail.basics.website.replace(/^https?:\/\//, "") : "Unavailable"} />
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white p-5 shadow-panel">
          <h2 className="text-lg font-bold">Recent News</h2>
          <div className="mt-4 space-y-3">
            {detail.news.length ? detail.news.map((item) => (
              <div key={`${item.headline}-${item.publishedAt}`} className="rounded-lg border border-slate-100 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="blue">{item.category}</Badge>
                  <span className="text-xs text-slate-500">{item.source} / {new Date(item.publishedAt).toLocaleDateString()}</span>
                </div>
                <div className="mt-2 font-semibold">{item.headline}</div>
              </div>
            )) : <EmptyState title="No news available" body="Connect a news API to show live headlines." />}
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-line bg-white p-5 shadow-panel">
          <h2 className="text-lg font-bold">Financial Snapshot</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <MiniStat label="Revenue" value={formatLarge(detail.fundamentals.revenue)} />
            <MiniStat label="Net income" value={formatLarge(detail.fundamentals.netIncome)} />
            <MiniStat label="Free cash flow" value={formatLarge(detail.fundamentals.freeCashFlow)} />
            <MiniStat label="Gross margin" value={formatPercent(detail.fundamentals.grossMargin)} />
            <MiniStat label="YoY revenue growth" value={formatPercent(detail.fundamentals.revenueGrowthYoY)} />
            <MiniStat label="EPS" value={detail.fundamentals.eps == null ? "n/a" : `$${detail.fundamentals.eps.toFixed(2)}`} />
            <MiniStat label="Cash" value={formatLarge(detail.fundamentals.cash)} />
            <MiniStat label="Debt" value={formatLarge(detail.fundamentals.debt)} />
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white p-5 shadow-panel">
          <h2 className="text-lg font-bold">Risk Flags</h2>
          <div className="mt-4 space-y-3">
            {detail.risks.map((risk) => (
              <div key={risk.label} className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 p-3">
                <div>
                  <div className="font-semibold">{risk.label}</div>
                  <p className="mt-1 text-sm text-slate-500">{risk.detail}</p>
                </div>
                <Badge tone={risk.active ? "red" : "green"}>{risk.active ? "Flagged" : "Clear"}</Badge>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function formatChartLabels(prices: StockDetail["prices"], timeframe: Timeframe) {
  return prices.map((price) => ({
    ...price,
    label: new Date(price.date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: timeframe === "1D" || timeframe === "5D" ? "numeric" : undefined,
      year: timeframe === "5Y" || timeframe === "MAX" ? "2-digit" : undefined
    })
  }));
}

function getPercentChange(prices: Array<{ close: number }>) {
  if (prices.length < 2) return 0;
  const first = prices[0].close;
  const last = prices.at(-1)?.close ?? first;
  return ((last - first) / Math.max(1, first)) * 100;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 break-words font-bold">{value}</div>
    </div>
  );
}

function InfoList({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="mt-4">
      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.length ? values.map((value) => <Badge key={value}>{value}</Badge>) : <Badge>Unavailable from Finnhub endpoints</Badge>}
      </div>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="p-8 text-center">
      <div className="font-semibold text-ink">{title}</div>
      <p className="mt-1 text-sm text-slate-500">{body}</p>
    </div>
  );
}

function formatTooltip(value: unknown, name: string) {
  if (name === "Volume") return [formatLarge(Number(value)), name];
  return [formatCurrency(Number(value)), name];
}

function formatCurrency(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "n/a";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: value > 1000 ? 0 : 2 }).format(value);
}

function formatLarge(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "n/a";
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function formatPercent(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "n/a";
  return `${(value * 100).toFixed(1)}%`;
}

function formatNumber(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "n/a";
  return value.toFixed(1);
}
