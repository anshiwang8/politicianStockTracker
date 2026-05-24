import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/Badge";
import { TradeTable } from "@/components/TradeTable";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PoliticianPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const politician = await prisma.politician.findUnique({
    where: { id },
    include: {
      disclosures: {
        include: { stock: true, politician: true },
        orderBy: { transactionDate: "desc" }
      }
    }
  });

  if (!politician) notFound();
  const buys = politician.disclosures.filter((trade) => trade.tradeType === "BUY").length;
  const sells = politician.disclosures.filter((trade) => trade.tradeType === "SELL").length;

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <Link className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline" href="/">
        <ArrowLeft className="h-4 w-4" />
        Dashboard
      </Link>
      <section className="rounded-lg border border-line bg-white p-5 shadow-panel">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{politician.name}</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge>{politician.party}</Badge>
              <Badge tone="blue">{politician.chamber}</Badge>
              <Badge>{politician.state}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <MiniStat label="Disclosures" value={politician.disclosures.length.toString()} />
            <MiniStat label="Buys" value={buys.toString()} />
            <MiniStat label="Sells" value={sells.toString()} />
          </div>
        </div>
        <div className="mt-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Committees</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {politician.committees.map((committee) => (
              <Badge key={committee} tone="gold">{committee}</Badge>
            ))}
          </div>
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-bold">Disclosure History</h2>
        <TradeTable trades={JSON.parse(JSON.stringify(politician.disclosures))} />
      </section>
    </main>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-paper px-4 py-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}
