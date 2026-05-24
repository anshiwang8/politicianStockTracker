import type { Chamber, DisclosureSource, Party, TradeType } from "@prisma/client";

export const mockPoliticians = [
  { name: "Alexandra Reyes", party: "DEMOCRAT" as Party, chamber: "HOUSE" as Chamber, state: "CA", committees: ["Energy and Commerce", "Science Space and Technology"] },
  { name: "Thomas Whitaker", party: "REPUBLICAN" as Party, chamber: "SENATE" as Chamber, state: "TX", committees: ["Armed Services", "Commerce Science and Transportation"] },
  { name: "Maya Chen", party: "DEMOCRAT" as Party, chamber: "SENATE" as Chamber, state: "WA", committees: ["Health Education Labor and Pensions", "Finance"] },
  { name: "Grant Hollis", party: "REPUBLICAN" as Party, chamber: "HOUSE" as Chamber, state: "OH", committees: ["Financial Services", "Transportation and Infrastructure"] },
  { name: "Nora Patel", party: "INDEPENDENT" as Party, chamber: "SENATE" as Chamber, state: "ME", committees: ["Budget", "Homeland Security"] },
  { name: "Daniel Brooks", party: "DEMOCRAT" as Party, chamber: "HOUSE" as Chamber, state: "NY", committees: ["Financial Services", "Small Business"] },
  { name: "Caroline Price", party: "REPUBLICAN" as Party, chamber: "HOUSE" as Chamber, state: "FL", committees: ["Ways and Means", "Energy and Commerce"] },
  { name: "Evan Kim", party: "DEMOCRAT" as Party, chamber: "HOUSE" as Chamber, state: "IL", committees: ["Appropriations", "Transportation and Infrastructure"] },
  { name: "Rebecca Stone", party: "REPUBLICAN" as Party, chamber: "SENATE" as Chamber, state: "NC", committees: ["Banking Housing and Urban Affairs", "Armed Services"] },
  { name: "Luis Moreno", party: "DEMOCRAT" as Party, chamber: "SENATE" as Chamber, state: "AZ", committees: ["Commerce Science and Transportation", "Energy and Natural Resources"] },
  { name: "Iris Wallace", party: "INDEPENDENT" as Party, chamber: "HOUSE" as Chamber, state: "VT", committees: ["Agriculture", "Oversight and Accountability"] },
  { name: "Peter Lang", party: "REPUBLICAN" as Party, chamber: "HOUSE" as Chamber, state: "PA", committees: ["Science Space and Technology", "Education and Workforce"] }
];

export const mockStocks = [
  { ticker: "NVDA", companyName: "NVIDIA Corporation", sector: "Technology", industry: "Semiconductors", marketCap: 2800000000000 },
  { ticker: "MSFT", companyName: "Microsoft Corporation", sector: "Technology", industry: "Cloud Computing", marketCap: 3100000000000 },
  { ticker: "LLY", companyName: "Eli Lilly and Company", sector: "Healthcare", industry: "Pharmaceuticals", marketCap: 760000000000 },
  { ticker: "RTX", companyName: "RTX Corporation", sector: "Industrials", industry: "Aerospace and Defense", marketCap: 145000000000 },
  { ticker: "OKLO", companyName: "Oklo Inc.", sector: "Energy", industry: "Nuclear Energy", marketCap: 3800000000 },
  { ticker: "AMD", companyName: "Advanced Micro Devices Inc.", sector: "Technology", industry: "Semiconductors", marketCap: 260000000000 },
  { ticker: "PLTR", companyName: "Palantir Technologies Inc.", sector: "Technology", industry: "AI Analytics", marketCap: 170000000000 },
  { ticker: "CRWD", companyName: "CrowdStrike Holdings Inc.", sector: "Technology", industry: "Cybersecurity", marketCap: 82000000000 },
  { ticker: "JPM", companyName: "JPMorgan Chase and Co.", sector: "Financials", industry: "Banking", marketCap: 610000000000 },
  { ticker: "V", companyName: "Visa Inc.", sector: "Financials", industry: "Payments", marketCap: 560000000000 },
  { ticker: "UNH", companyName: "UnitedHealth Group Incorporated", sector: "Healthcare", industry: "Managed Healthcare", marketCap: 470000000000 },
  { ticker: "XOM", companyName: "Exxon Mobil Corporation", sector: "Energy", industry: "Integrated Oil and Gas", marketCap: 510000000000 },
  { ticker: "CEG", companyName: "Constellation Energy Corporation", sector: "Utilities", industry: "Nuclear Power", marketCap: 95000000000 },
  { ticker: "LMT", companyName: "Lockheed Martin Corporation", sector: "Industrials", industry: "Aerospace and Defense", marketCap: 112000000000 },
  { ticker: "TSLA", companyName: "Tesla Inc.", sector: "Consumer Cyclical", industry: "Electric Vehicles and Robotics", marketCap: 620000000000 }
];

const baseFundamentals = {
  revenueGrowthYoY: 0.12,
  revenueCagr3Y: 0.1,
  netIncomeGrowthYoY: 0.1,
  epsGrowthYoY: 0.09,
  operatingIncomeGrowth: 0.1,
  grossMargin: 0.42,
  operatingMargin: 0.18,
  netMargin: 0.13,
  debtToEquity: 0.7,
  netDebt: 6000000000,
  freeCashFlow: 3500000000,
  operatingCashFlow: 5200000000,
  interestCoverage: 7,
  roic: 0.13,
  buybackYield: 0.006,
  dilutionRate: 0.002,
  priceToSales: 7,
  forwardPriceToSales: 6,
  priceToEarnings: 28,
  forwardPriceToEarnings: 23,
  evToEbitda: 18,
  pegRatio: 1.8,
  rdToRevenue: 0.1
};

export const mockFundamentals = {
  NVDA: { ...baseFundamentals, revenueGrowthYoY: 1.22, revenueCagr3Y: 0.54, netIncomeGrowthYoY: 1.95, epsGrowthYoY: 1.87, operatingIncomeGrowth: 2.11, grossMargin: 0.73, operatingMargin: 0.61, netMargin: 0.53, debtToEquity: 0.2, netDebt: -18000000000, freeCashFlow: 27000000000, operatingCashFlow: 28000000000, interestCoverage: 45, roic: 0.72, priceToSales: 28, forwardPriceToSales: 19, priceToEarnings: 65, forwardPriceToEarnings: 38, evToEbitda: 44, pegRatio: 1.4, rdToRevenue: 0.14 },
  MSFT: { ...baseFundamentals, revenueGrowthYoY: 0.16, revenueCagr3Y: 0.15, netIncomeGrowthYoY: 0.22, epsGrowthYoY: 0.21, operatingIncomeGrowth: 0.24, grossMargin: 0.7, operatingMargin: 0.45, netMargin: 0.36, debtToEquity: 0.32, netDebt: -47000000000, freeCashFlow: 67000000000, operatingCashFlow: 118000000000, interestCoverage: 35, roic: 0.34, priceToSales: 12, forwardPriceToSales: 10, priceToEarnings: 36, forwardPriceToEarnings: 29, evToEbitda: 25, pegRatio: 2.2, rdToRevenue: 0.13 },
  LLY: { ...baseFundamentals, revenueGrowthYoY: 0.2, revenueCagr3Y: 0.13, netIncomeGrowthYoY: 0.18, epsGrowthYoY: 0.15, grossMargin: 0.79, operatingMargin: 0.33, netMargin: 0.22, debtToEquity: 1.6, netDebt: 21000000000, freeCashFlow: 5600000000, interestCoverage: 8, roic: 0.21, priceToSales: 19, forwardPriceToSales: 15, priceToEarnings: 78, forwardPriceToEarnings: 43, evToEbitda: 38, pegRatio: 1.9, rdToRevenue: 0.24 },
  RTX: { ...baseFundamentals, revenueGrowthYoY: 0.07, revenueCagr3Y: 0.08, netIncomeGrowthYoY: 0.09, grossMargin: 0.22, operatingMargin: 0.09, netMargin: 0.06, debtToEquity: 0.78, netDebt: 34000000000, freeCashFlow: 4800000000, interestCoverage: 5.8, roic: 0.09, priceToSales: 2.1, forwardPriceToSales: 1.9, priceToEarnings: 29, forwardPriceToEarnings: 21, evToEbitda: 15, pegRatio: 2.0, rdToRevenue: 0.06 },
  OKLO: { ...baseFundamentals, revenueGrowthYoY: 0, revenueCagr3Y: 0, netIncomeGrowthYoY: -0.35, epsGrowthYoY: -0.31, operatingIncomeGrowth: -0.3, grossMargin: 0, operatingMargin: -1.2, netMargin: -1.4, debtToEquity: 0.05, netDebt: -210000000, freeCashFlow: -43000000, operatingCashFlow: -39000000, interestCoverage: 0, roic: -0.18, dilutionRate: 0.08, priceToSales: 0, forwardPriceToSales: 45, priceToEarnings: 0, forwardPriceToEarnings: 0, evToEbitda: 0, pegRatio: 0, rdToRevenue: 0.42 },
  AMD: { ...baseFundamentals, revenueGrowthYoY: 0.18, revenueCagr3Y: 0.23, netIncomeGrowthYoY: 0.12, grossMargin: 0.5, operatingMargin: 0.09, netMargin: 0.05, debtToEquity: 0.04, netDebt: -2200000000, freeCashFlow: 1900000000, interestCoverage: 22, roic: 0.08, priceToSales: 11, forwardPriceToSales: 8, priceToEarnings: 55, forwardPriceToEarnings: 32, evToEbitda: 31, pegRatio: 1.7, rdToRevenue: 0.24 },
  PLTR: { ...baseFundamentals, revenueGrowthYoY: 0.27, revenueCagr3Y: 0.22, netIncomeGrowthYoY: 0.58, epsGrowthYoY: 0.5, grossMargin: 0.81, operatingMargin: 0.18, netMargin: 0.16, debtToEquity: 0.06, netDebt: -3600000000, freeCashFlow: 980000000, interestCoverage: 30, roic: 0.16, priceToSales: 48, forwardPriceToSales: 34, priceToEarnings: 160, forwardPriceToEarnings: 80, evToEbitda: 90, pegRatio: 2.7, rdToRevenue: 0.18 },
  CRWD: { ...baseFundamentals, revenueGrowthYoY: 0.31, revenueCagr3Y: 0.42, netIncomeGrowthYoY: 0.4, grossMargin: 0.75, operatingMargin: 0.1, netMargin: 0.05, debtToEquity: 0.25, netDebt: -2600000000, freeCashFlow: 1200000000, interestCoverage: 14, roic: 0.12, priceToSales: 18, forwardPriceToSales: 14, priceToEarnings: 90, forwardPriceToEarnings: 58, evToEbitda: 55, pegRatio: 1.9, rdToRevenue: 0.26 },
  JPM: { ...baseFundamentals, revenueGrowthYoY: 0.09, revenueCagr3Y: 0.11, netIncomeGrowthYoY: 0.13, grossMargin: 0.55, operatingMargin: 0.38, netMargin: 0.28, debtToEquity: 1.1, netDebt: 90000000000, freeCashFlow: 25000000000, interestCoverage: 6, roic: 0.12, priceToSales: 3.2, forwardPriceToSales: 3, priceToEarnings: 13, forwardPriceToEarnings: 12, evToEbitda: 10, pegRatio: 1.5, rdToRevenue: 0.01 },
  V: { ...baseFundamentals, revenueGrowthYoY: 0.1, revenueCagr3Y: 0.13, netIncomeGrowthYoY: 0.13, grossMargin: 0.78, operatingMargin: 0.65, netMargin: 0.53, debtToEquity: 0.55, netDebt: 9000000000, freeCashFlow: 19000000000, interestCoverage: 25, roic: 0.33, priceToSales: 16, forwardPriceToSales: 14, priceToEarnings: 31, forwardPriceToEarnings: 26, evToEbitda: 24, pegRatio: 2.0, rdToRevenue: 0.05 },
  UNH: { ...baseFundamentals, revenueGrowthYoY: 0.08, revenueCagr3Y: 0.11, netIncomeGrowthYoY: 0.04, grossMargin: 0.24, operatingMargin: 0.08, netMargin: 0.04, debtToEquity: 0.74, netDebt: 42000000000, freeCashFlow: 24000000000, interestCoverage: 8, roic: 0.14, priceToSales: 1.2, forwardPriceToSales: 1.1, priceToEarnings: 22, forwardPriceToEarnings: 17, evToEbitda: 14, pegRatio: 1.6, rdToRevenue: 0.01 },
  XOM: { ...baseFundamentals, revenueGrowthYoY: 0.03, revenueCagr3Y: 0.08, netIncomeGrowthYoY: -0.04, grossMargin: 0.29, operatingMargin: 0.16, netMargin: 0.1, debtToEquity: 0.18, netDebt: 12000000000, freeCashFlow: 36000000000, interestCoverage: 28, roic: 0.14, priceToSales: 1.4, forwardPriceToSales: 1.3, priceToEarnings: 14, forwardPriceToEarnings: 13, evToEbitda: 7, pegRatio: 2.4, rdToRevenue: 0.01 },
  CEG: { ...baseFundamentals, revenueGrowthYoY: 0.19, revenueCagr3Y: 0.12, netIncomeGrowthYoY: 0.24, grossMargin: 0.35, operatingMargin: 0.22, netMargin: 0.15, debtToEquity: 0.82, netDebt: 8500000000, freeCashFlow: 2300000000, interestCoverage: 5.5, roic: 0.12, priceToSales: 4.8, forwardPriceToSales: 4.1, priceToEarnings: 31, forwardPriceToEarnings: 25, evToEbitda: 17, pegRatio: 1.8, rdToRevenue: 0.03 },
  LMT: { ...baseFundamentals, revenueGrowthYoY: 0.05, revenueCagr3Y: 0.04, netIncomeGrowthYoY: 0.06, grossMargin: 0.13, operatingMargin: 0.11, netMargin: 0.09, debtToEquity: 1.9, netDebt: 17000000000, freeCashFlow: 6200000000, interestCoverage: 9, roic: 0.18, priceToSales: 1.7, forwardPriceToSales: 1.6, priceToEarnings: 18, forwardPriceToEarnings: 17, evToEbitda: 13, pegRatio: 2.1, rdToRevenue: 0.03 },
  TSLA: { ...baseFundamentals, revenueGrowthYoY: 0.04, revenueCagr3Y: 0.24, netIncomeGrowthYoY: -0.22, epsGrowthYoY: -0.2, operatingIncomeGrowth: -0.18, grossMargin: 0.18, operatingMargin: 0.07, netMargin: 0.08, debtToEquity: 0.12, netDebt: -14000000000, freeCashFlow: 4400000000, interestCoverage: 20, roic: 0.09, priceToSales: 7.8, forwardPriceToSales: 6.4, priceToEarnings: 75, forwardPriceToEarnings: 48, evToEbitda: 41, pegRatio: 2.8, rdToRevenue: 0.05 }
};

const tradeSizes = [
  [7500, "$1,001 - $15,000"],
  [32500, "$15,001 - $50,000"],
  [75000, "$50,001 - $100,000"],
  [175000, "$100,001 - $250,000"],
  [375000, "$250,001 - $500,000"],
  [750000, "$500,001 - $1,000,000"]
] as const;

const tradeTickers = mockStocks.map((stock) => stock.ticker);

export const mockTrades = Array.from({ length: 84 }, (_, index) => {
  const politician = mockPoliticians[index % mockPoliticians.length];
  const ticker = tradeTickers[(index * 5 + Math.floor(index / 3)) % tradeTickers.length];
  const isSell = index % 6 === 0 || index % 11 === 0;
  const [estimatedValue, transactionSizeRange] = tradeSizes[(index * 7 + 2) % tradeSizes.length];
  const transactionDaysAgo = 2 + ((index * 3) % 58);
  const disclosureDaysAgo = Math.max(1, transactionDaysAgo - (1 + (index % 8)));
  const source = politician.chamber === "SENATE" ? "SENATE" : "HOUSE";

  return [
    politician.name,
    ticker,
    (isSell ? "SELL" : "BUY") as TradeType,
    estimatedValue,
    transactionSizeRange,
    transactionDaysAgo,
    disclosureDaysAgo,
    source as DisclosureSource
  ];
}) as Array<[string, string, TradeType, number, string, number, number, DisclosureSource]>;

export const mockCatalysts = [
  ["NVDA", "Next-generation AI accelerator ramp", "Product launch", 90, "Datacenter demand remains the central catalyst."],
  ["MSFT", "Cloud AI contract expansion", "Partnership", 82, "Azure AI workloads support durable revenue growth."],
  ["LLY", "Obesity drug capacity expansion", "Healthcare approval", 86, "Manufacturing scale is a key execution lever."],
  ["RTX", "Defense backlog and international orders", "Government contract", 72, "Defense budgets support visibility."],
  ["OKLO", "Nuclear licensing milestone", "Regulatory", 76, "High upside but binary regulatory timing."],
  ["AMD", "AI PC and accelerator share gains", "Product launch", 78, "Growth depends on execution against incumbent suppliers."],
  ["PLTR", "Government AI platform deployments", "Government contract", 84, "Public sector demand and commercial AI pilots support upside."],
  ["CRWD", "Cloud security module expansion", "Product launch", 79, "Cross-sell remains the main profitability lever."],
  ["JPM", "Net interest income resilience", "Macro", 65, "Credit quality and rate path drive near-term sentiment."],
  ["V", "Payment volume recovery", "Macro", 74, "Consumer spend and cross-border travel remain important drivers."],
  ["UNH", "Medicare Advantage repricing", "Policy", 62, "Policy pressure offsets defensive demand."],
  ["XOM", "LNG and Guyana production growth", "Energy project", 68, "Commodity prices remain the largest swing factor."],
  ["CEG", "Nuclear power demand from datacenters", "Partnership", 82, "Power demand from AI infrastructure improves long-term visibility."],
  ["LMT", "Missile defense procurement cycle", "Government contract", 71, "Backlog visibility is strong, but budget timing matters."],
  ["TSLA", "Robotics and autonomy milestones", "Product launch", 66, "Execution potential is high, but earnings visibility is uneven."]
] as Array<[string, string, string, number, string]>;

export const mockMacro = [
  ["Technology", "AI infrastructure cycle", 0.83, 84, "Enterprise AI capex remains elevated."],
  ["Healthcare", "Drug pricing and demographics", 0.72, 76, "Demand is resilient, policy risk remains."],
  ["Industrials", "Defense and aerospace cycle", 0.7, 73, "Government demand offsets rate sensitivity."],
  ["Energy", "Energy security and nuclear policy", 0.66, 69, "Policy support is improving, financing risk remains."],
  ["Financials", "Rates and credit cycle", 0.58, 61, "Rate cuts could help volumes, while credit risk needs watching."],
  ["Utilities", "Datacenter power demand", 0.78, 80, "Electrification and AI load growth support nuclear-heavy operators."],
  ["Consumer Cyclical", "Consumer demand and financing costs", 0.48, 52, "Higher financing sensitivity weighs on expensive durable goods."]
] as Array<[string, string, number, number, string]>;
