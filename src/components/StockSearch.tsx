"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";

type SearchResult = {
  ticker: string;
  companyName: string;
  exchange: string | null;
  sector: string | null;
  industry: string | null;
};

export function StockSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    setError("");

    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(`/api/stocks/search?q=${encodeURIComponent(trimmed)}`);
        if (!response.ok) throw new Error("Unable to fetch stock data");
        const payload = await response.json() as { results?: SearchResult[] };
        setResults(payload.results ?? []);
        setOpen(true);
      } catch {
        setResults([]);
        setError("Unable to fetch stock data");
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div ref={containerRef} className="relative rounded-lg border border-line bg-white p-4 shadow-panel">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <input
          className="h-11 w-full rounded-lg border border-line bg-white pl-10 pr-10 text-sm outline-none focus:border-accent"
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(Boolean(query.trim()))}
          placeholder="Search NASDAQ or NYSE stocks..."
          value={query}
        />
        {loading ? <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-accent" /> : null}
      </label>

      {open && query.trim() ? (
        <div className="absolute left-4 right-4 top-[64px] z-20 overflow-hidden rounded-lg border border-line bg-white shadow-panel">
          {loading ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading results
            </div>
          ) : error ? (
            <div className="px-4 py-3 text-sm font-semibold text-rose-700">{error}</div>
          ) : results.length ? (
            <div className="max-h-80 overflow-auto">
              {results.map((result) => (
                <button
                  key={`${result.ticker}-${result.exchange}`}
                  className="grid w-full grid-cols-[92px_1fr] gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm hover:bg-cyan-50"
                  onClick={() => router.push(`/stocks/${result.ticker}`)}
                  type="button"
                >
                  <span className="font-bold text-ink">{result.ticker}</span>
                  <span>
                    <span className="block font-semibold">{result.companyName}</span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {result.exchange ?? "U.S. listed"} / {result.sector ?? result.industry ?? "Sector unavailable"}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-3 text-sm text-slate-500">No results found</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
