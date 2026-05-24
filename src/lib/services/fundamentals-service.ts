import { mockFundamentals } from "@/lib/mock-data";

export async function fetchFundamentals(ticker: string) {
  return mockFundamentals[ticker as keyof typeof mockFundamentals] ?? null;
}
