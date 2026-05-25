"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, Star } from "lucide-react";
import { Badge } from "@/components/Badge";
import { Header } from "@/components/Header";
import { ScoreBreakdown } from "@/components/ScoreBreakdown";
import { ScoreRing } from "@/components/ScoreRing";
import { StockSearch } from "@/components/StockSearch";
import { TradeTable } from "@/components/TradeTable";
import type { DashboardPayload } from "@/types/dashboard";

export default function DashboardClient({ initialData }: { initialData: DashboardPayload }) {
  const [data, setData] = useState(initialData);
  const [query, setQuery] = useState("");
  const [party, setParty] = useState("ALL");
  const [chamber, setChamber] = useState("ALL");
  const [sector, setSector] = useState("ALL");
  const [tradeType, setTradeType] = useState("ALL");
  const [refreshStatus, setRefreshStatus] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      const response = await fetch("/api/dashboard");
      setData(await response.json());
    }

    const source = new EventSource("/api/events");
    source.addEventListener("dashboard-refresh", loadDashboard);
    source.addEventListener("heartbeat", loadDashboard);

    const fallback = setInterval(loadDashboard, 60_000);
    return () => {
      clearInterval(fallback);
      source.close();
    };
  }, []);

  const filteredTrades = useMemo(() => {
    const normalizedQuery = normalize(query);
    const normalizedParty = normalize(party);
    const normalizedChamber = normalize(chamber);
    const normalizedSector = normalize(sector);
    const normalizedTradeType = normalize(tradeType);

    return data.trades.filter((trade) => {
      const text = normalize(`${trade.politician?.name ?? ""} ${trade.ticker} ${trade.companyName} ${trade.stock?.sector ?? ""}`);
      return (
        text.includes(normalizedQuery) &&
        (normalizedParty === "ALL" || normalize(trade.politician?.party) === normalizedParty) &&
        (normalizedChamber === "ALL" || normalize(trade.politician?.chamber) === normalizedChamber) &&
        (normalizedSector === "ALL" || normalize(trade.stock?.sector) === normalizedSector) &&
        (normalizedTradeType === "ALL" || normalize(trade.tradeType) === normalizedTradeType)
      );
    });
  }, [chamber, data.trades, party, query, sector, tradeType]);

  async function refresh() {
    const response = await fetch("/api/refresh", { method: "POST" });
    if (response.ok) {
      const result = await response.json();
      if (result.error) {
        setRefreshStatus(`${result.error} Run npm.cmd run refresh:politician-trades after enabling access.`);
      } else {
        setRefreshStatus(`Politician trades refreshed. Fetched ${result.disclosureCount ?? 0}, created ${result.created ?? 0}, updated ${result.updated ?? 0}.`);
      }
      const next = await fetch("/api/dashboard");
      setData(await next.json());
    } else {
      setRefreshStatus("Unable to refresh politician trades. Run npm.cmd run refresh:politician-trades in PowerShell.");
    }
  }

  const sectors = Array.from(new Set(data.trades.map((trade) => trade.stock.sector))).sort();
  const chambers = Array.from(new Set(data.trades.map((trade) => trade.politician.chamber))).sort();

  return (
    <main>
      <Header lastUpdated={data.lastUpdated} onRefresh={refresh} />
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <StockSearch />

        <section className="rounded-lg border border-line bg-white px-4 py-3 text-sm shadow-panel">
          <span className="text-slate-500">Last politician data updated: </span>
          <span className="font-semibold">
            {data.lastPoliticianDataUpdated ? new Date(data.lastPoliticianDataUpdated).toLocaleString() : "No live congressional trades loaded yet"}
          </span>
          {refreshStatus ? <div className="mt-2 font-semibold text-amber-700">{refreshStatus}</div> : null}
        </section>

        {!data.trades.length ? (
          <section className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">
            No live politician trading data loaded yet. No politician trade data available yet. Run refresh:politician-trades.
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="Tracked tickers" value={data.rankings.length.toString()} />
          <Metric label="Recent disclosures" value={data.trades.length.toString()} />
          <Metric label="Watchlist alerts" value={data.watchlist.length.toString()} />
          <Metric label="Top score" value={Math.round(data.rankings[0]?.finalScore ?? 0).toString()} />
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Top Ranked Picks</h2>
            <Link className="text-sm font-semibold text-accent hover:underline" href="/settings">
              Edit score weights
            </Link>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {data.rankings.length ? data.rankings.slice(0, 5).map((ranking, index) => {
              const rating = getRating(ranking.finalScore);
              return (
                <article key={ranking.id} className="rounded-lg border border-line bg-white p-4 shadow-panel">
                  <div className="flex items-start gap-4">
                    <ScoreRing score={ranking.finalScore} size="lg" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="gold">#{index + 1}</Badge>
                        <Badge tone={rating.tone}>{rating.label}</Badge>
                        <Badge tone="blue">{ranking.stock.sector}</Badge>
                        <Badge tone="neutral">{ranking.stock.industry}</Badge>
                      </div>
                      <Link href={`/stocks/${ranking.stock.ticker}`} className="mt-2 block text-xl font-bold hover:text-accent">
                        {ranking.stock.ticker} / {ranking.stock.companyName}
                      </Link>
                      <p className="mt-2 text-sm text-slate-600">{getRatingReason(ranking)}</p>
                      <div className="mt-3">
                        <ScoreBreakdown ranking={ranking} />
                      </div>
                    </div>
                    <button className="rounded-lg border border-line p-2 hover:border-accent" title="Add to watchlist" type="button">
                      <Star className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              );
            }) : (
              <div className="rounded-lg border border-line bg-white p-5 text-sm font-semibold text-slate-600 shadow-panel lg:col-span-2">
                No politician trade data available yet. Run refresh:politician-trades.
              </div>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-lg font-bold">Recent Politician Trades</h2>
              <p className="text-sm text-slate-500">Filters cover politician, party, chamber, sector, ticker, buy/sell, date recency, and reported size ranges.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  className="h-10 rounded-lg border border-line bg-white pl-9 pr-3 text-sm outline-none focus:border-accent"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search"
                  value={query}
                />
              </label>
              <FilterSelect label="Party" value={party} onChange={setParty} options={["ALL", "DEMOCRAT", "REPUBLICAN", "INDEPENDENT"]} />
              <FilterSelect label="Chamber" value={chamber} onChange={setChamber} options={["ALL", ...chambers]} />
              <FilterSelect label="Sector" value={sector} onChange={setSector} options={["ALL", ...sectors]} />
              <FilterSelect label="Trade" value={tradeType} onChange={setTradeType} options={["ALL", "BUY", "SELL", "EXCHANGE"]} />
              <div className="grid h-10 place-items-center rounded-lg border border-line bg-white px-3" title="Advanced filters">
                <SlidersHorizontal className="h-4 w-4 text-slate-500" />
              </div>
            </div>
          </div>
          <TradeTable trades={filteredTrades} />
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-white p-4 shadow-panel">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1 text-xs font-semibold text-slate-500">
      <span className="sr-only">{label}</span>
      <select className="h-10 rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none focus:border-accent" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function normalize(value: unknown) {
  return String(value ?? "").trim().toUpperCase();
}

function getRating(score: number): { label: "BUY" | "HOLD" | "SELL"; tone: "green" | "gold" | "red" } {
  if (score >= 80) return { label: "BUY", tone: "green" };
  if (score >= 60) return { label: "HOLD", tone: "gold" };
  return { label: "SELL", tone: "red" };
}

function getRatingReason(ranking: DashboardPayload["rankings"][number]) {
  const strengths: string[] = [];
  const cautions: string[] = [];

  if (ranking.fundamentalGrowthScore >= 75) strengths.push("strong growth");
  if (ranking.profitabilityMarginScore >= 70) strengths.push("healthy margins and cash flow");
  if (ranking.moatScore >= 70) strengths.push("durable moat");
  if (ranking.catalystMacroScore >= 70) strengths.push("positive catalysts and macro setup");
  if (ranking.politicianActivityScore >= 70) strengths.push("broad recent politician buying");

  if (ranking.valuationScore < 55) cautions.push("valuation is expensive");
  if (ranking.profitabilityMarginScore < 50) cautions.push("profitability is weak");
  if (ranking.fundamentalGrowthScore < 50) cautions.push("growth is limited");

  const main = strengths.slice(0, 2).join(" and ") || "mixed fundamentals";
  const caution = cautions[0] ? `, but ${cautions[0]}` : "";
  return `${capitalize(main)}${caution}.`;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
