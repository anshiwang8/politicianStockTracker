import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { StockDetailClient } from "@/components/StockDetailClient";
import { getStockDetail } from "@/lib/services/stock-data-service";

export const dynamic = "force-dynamic";

export default async function StockPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const detail = await getStockDetail(ticker);

  if (!detail) notFound();

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <Link className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline" href="/">
        <ArrowLeft className="h-4 w-4" />
        Dashboard
      </Link>
      <StockDetailClient detail={detail} />
    </main>
  );
}
