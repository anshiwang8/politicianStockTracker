import { mockMacro } from "@/lib/mock-data";

export async function fetchMacroForSector(sector: string) {
  return mockMacro.find(([candidate]) => candidate === sector) ?? null;
}
