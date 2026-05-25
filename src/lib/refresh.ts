import { refreshPoliticianTrades } from "@/lib/politician-trade-refresh";

export async function refreshDisclosuresAndScores() {
  const result = await refreshPoliticianTrades();
  return { refreshedAt: result.refreshedAt, disclosureCount: result.fetched, created: result.created, updated: result.updated };
}
