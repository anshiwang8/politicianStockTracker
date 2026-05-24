"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/Badge";
import type { Trade } from "@/types/dashboard";

export function TradeTable({ trades }: { trades: Trade[] }) {
  if (!trades.length) {
    return (
      <div className="rounded-lg border border-line bg-white p-8 text-center shadow-panel">
        <div className="font-semibold text-ink">No trades found for this filter</div>
        <p className="mt-1 text-sm text-slate-500">Try a broader party, chamber, sector, ticker, or buy/sell filter.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white shadow-panel">
      <div className="max-h-[520px] overflow-auto">
        <table className="w-full min-w-[1120px] table-fixed border-collapse text-sm">
          <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="w-[230px] px-4 py-3">Politician</th>
              <th className="w-[92px] px-4 py-3">Trade</th>
              <th className="w-[92px] px-4 py-3">Ticker</th>
              <th className="w-[240px] px-4 py-3">Company</th>
              <th className="w-[170px] px-4 py-3">Size</th>
              <th className="w-[130px] px-4 py-3">Transaction</th>
              <th className="w-[150px] px-4 py-3">Disclosed</th>
              <th className="w-[100px] px-4 py-3">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {trades.map((trade) => {
              const recent = Date.now() - new Date(trade.disclosureDate).getTime() < 7 * 86_400_000;
              const politician = trade.politician;

              return (
                <tr key={trade.id} className={recent ? "bg-cyan-50/45" : "bg-white"}>
                  <td className="px-4 py-3 align-top">
                    <Link className="block truncate font-semibold hover:text-accent" href={politician?.id ? `/politicians/${politician.id}` : "#"}>
                      {politician?.name ?? "Unknown politician"}
                    </Link>
                    <div className="mt-1 truncate text-xs text-slate-500">
                      {politician?.party ?? "UNKNOWN"} / {politician?.chamber ?? "UNKNOWN"} / {politician?.state ?? "--"}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Badge tone={trade.tradeType === "BUY" ? "green" : trade.tradeType === "SELL" ? "red" : "neutral"}>{trade.tradeType}</Badge>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Link className="font-bold hover:text-accent" href={`/stocks/${trade.ticker}`}>
                      {trade.ticker}
                    </Link>
                  </td>
                  <td className="truncate px-4 py-3 align-top text-slate-700">{trade.companyName}</td>
                  <td className="px-4 py-3 align-top">{trade.transactionSizeRange}</td>
                  <td className="px-4 py-3 align-top">{new Date(trade.transactionDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 align-top">
                    <div>{new Date(trade.disclosureDate).toLocaleDateString()}</div>
                    <div className="text-xs text-slate-500">{formatDistanceToNow(new Date(trade.disclosureDate), { addSuffix: true })}</div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <a className="text-accent hover:underline" href={trade.filingUrl} target="_blank">
                      {trade.source}
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
