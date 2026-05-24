"use client";

import { useMemo, useState } from "react";
import type { ScoreWeights } from "@/lib/scoring";

const labels: Array<[keyof ScoreWeights, string]> = [
  ["politicianActivity", "Politician Activity"],
  ["fundamentalGrowth", "Fundamental Growth"],
  ["profitabilityMargin", "Profitability / Margin"],
  ["valuation", "Valuation"],
  ["moat", "Moat"],
  ["catalystMacro", "Catalyst / Macro"]
];

export default function SettingsClient({ initialWeights }: { initialWeights: ScoreWeights }) {
  const [weights, setWeights] = useState(initialWeights);
  const [saved, setSaved] = useState(false);
  const total = useMemo(() => Object.values(weights).reduce((sum, value) => sum + Number(value), 0), [weights]);

  async function save() {
    const response = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weights })
    });
    setSaved(response.ok);
  }

  return (
    <div className="mt-5 space-y-5">
      {labels.map(([key, label]) => (
        <label key={key} className="grid gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">{label}</span>
            <span>{Math.round(weights[key] * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="0.6"
            step="0.01"
            value={weights[key]}
            onChange={(event) => setWeights((current) => ({ ...current, [key]: Number(event.target.value) }))}
            className="accent-teal-700"
          />
        </label>
      ))}
      <div className="rounded-lg border border-line bg-paper p-3 text-sm">
        <span className="text-slate-500">Current total </span>
        <span className="font-bold">{Math.round(total * 100)}%</span>
      </div>
      <button className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800" onClick={save} type="button">
        Save weights
      </button>
      {saved ? <span className="ml-3 text-sm font-semibold text-accent">Saved</span> : null}
    </div>
  );
}
