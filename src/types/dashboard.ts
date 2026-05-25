export type DashboardPayload = {
  rankings: Ranking[];
  trades: Trade[];
  watchlist: Array<{ id: string; alertMinScore: number; stock: Stock }>;
  lastUpdated: string;
  lastPoliticianDataUpdated?: string | null;
};

export type Stock = {
  id: string;
  ticker: string;
  companyName: string;
  sector: string;
  industry: string;
  marketCap?: string | number | null;
  catalysts?: Catalyst[];
};

export type Catalyst = {
  id: string;
  title: string;
  category: string;
  score: number;
  notes?: string | null;
  expectedAt?: string | null;
};

export type Ranking = {
  id: string;
  asOf: string;
  politicianActivityScore: number;
  fundamentalGrowthScore: number;
  profitabilityMarginScore: number;
  valuationScore: number;
  moatScore: number;
  catalystMacroScore: number;
  finalScore: number;
  breakdown: Record<string, unknown>;
  stock: Stock;
};

export type Politician = {
  id: string;
  name: string;
  party: "DEMOCRAT" | "REPUBLICAN" | "INDEPENDENT" | "OTHER";
  chamber: "HOUSE" | "SENATE";
  state: string;
  committees: string[];
};

export type Trade = {
  id: string;
  politician: Politician;
  stock: Stock;
  transactionDate: string;
  disclosureDate: string;
  ticker: string;
  companyName: string;
  tradeType: "BUY" | "SELL" | "EXCHANGE" | "OTHER";
  transactionSizeRange: string;
  estimatedValue: string | number;
  filingUrl: string;
  source: string;
};
