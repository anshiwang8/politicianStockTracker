"use client";

import Link from "next/link";

export default function StockError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-lg border border-line bg-white p-6 text-center shadow-panel">
        <h1 className="text-xl font-bold">Unable to fetch stock data</h1>
        <p className="mt-2 text-sm text-slate-500">The detail page could not fetch live stock, chart, or trade data.</p>
        <div className="mt-5 flex justify-center gap-3">
          <button className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white" onClick={reset} type="button">
            Try again
          </button>
          <Link className="rounded-lg border border-line px-4 py-2 text-sm font-semibold" href="/">
            Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
