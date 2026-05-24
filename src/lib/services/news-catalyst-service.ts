import { mockCatalysts } from "@/lib/mock-data";

export async function fetchCatalysts(ticker: string) {
  return mockCatalysts.filter(([candidate]) => candidate === ticker);
}
