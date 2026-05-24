import { Bell, RefreshCcw, ShieldCheck } from "lucide-react";

export function Header({ lastUpdated, onRefresh }: { lastUpdated?: string; onRefresh?: () => void }) {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-accent">
            <ShieldCheck className="h-4 w-4" />
            Public disclosure research dashboard
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-normal text-ink sm:text-3xl">Anshi&apos;s Political Stock Tracker</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-lg border border-line bg-paper px-3 py-2 text-sm">
            <span className="text-slate-500">Last updated </span>
            <span className="font-semibold">{lastUpdated ? new Date(lastUpdated).toLocaleString() : "loading"}</span>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold shadow-panel hover:border-accent"
            onClick={onRefresh}
            type="button"
            title="Refresh disclosures"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            type="button"
            title="Alert preferences"
          >
            <Bell className="h-4 w-4" />
            Alerts
          </button>
        </div>
      </div>
    </header>
  );
}
