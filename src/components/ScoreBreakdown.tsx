import type { Ranking } from "@/types/dashboard";

const rows = [
  ["Politician", "politicianActivityScore"],
  ["Growth", "fundamentalGrowthScore"],
  ["Margins", "profitabilityMarginScore"],
  ["Valuation", "valuationScore"],
  ["Moat", "moatScore"],
  ["Catalyst", "catalystMacroScore"]
] as const;

export function ScoreBreakdown({ ranking }: { ranking: Ranking }) {
  return (
    <div className="space-y-2">
      {rows.map(([label, key]) => {
        const value = Math.round(ranking[key]);
        return (
          <div key={key} className="grid grid-cols-[86px_1fr_36px] items-center gap-2 text-xs">
            <span className="text-slate-500">{label}</span>
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-accent" style={{ width: `${value}%` }} />
            </div>
            <span className="text-right font-semibold">{value}</span>
          </div>
        );
      })}
    </div>
  );
}
