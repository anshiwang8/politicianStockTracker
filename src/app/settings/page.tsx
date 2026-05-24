import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SettingsClient from "@/components/SettingsClient";
import { getScoreWeights } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <Link className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline" href="/">
        <ArrowLeft className="h-4 w-4" />
        Dashboard
      </Link>
      <section className="rounded-lg border border-line bg-white p-5 shadow-panel">
        <h1 className="text-2xl font-bold">Scoring Weights</h1>
        <SettingsClient initialWeights={getScoreWeights()} />
      </section>
    </main>
  );
}
