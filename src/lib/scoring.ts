import type {
  Catalyst,
  MacroIndicator,
  ManualScoreAdjustment,
  Politician,
  Stock,
  StockFundamentals,
  TradeDisclosure
} from "@prisma/client";

export type ScoreWeights = {
  politicianActivity: number;
  fundamentalGrowth: number;
  profitabilityMargin: number;
  valuation: number;
  moat: number;
  catalystMacro: number;
};

export const defaultWeights: ScoreWeights = {
  politicianActivity: 0.3,
  fundamentalGrowth: 0.25,
  profitabilityMargin: 0.15,
  valuation: 0.1,
  moat: 0.1,
  catalystMacro: 0.1
};

type TradeWithPolitician = TradeDisclosure & { politician: Politician };

export type RankingInput = {
  stock: Stock;
  trades: TradeWithPolitician[];
  fundamentals?: StockFundamentals | null;
  catalysts: Catalyst[];
  macro?: MacroIndicator | null;
  manualAdjustment?: ManualScoreAdjustment | null;
  weights?: ScoreWeights;
};

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const safe = (value: number | null | undefined, fallback = 0) => Number.isFinite(value ?? NaN) ? Number(value) : fallback;

function tradeSizeScore(rangeValue: unknown) {
  const value = Number(rangeValue ?? 0);
  if (value >= 1_000_000) return 24;
  if (value >= 250_000) return 18;
  if (value >= 50_000) return 12;
  if (value >= 15_000) return 8;
  return 4;
}

function daysAgo(date: Date) {
  return Math.max(0, (Date.now() - date.getTime()) / 86_400_000);
}

export function scorePoliticianActivity(trades: TradeWithPolitician[]) {
  const buys = trades.filter((trade) => trade.tradeType === "BUY");
  const uniqueBuyers = new Set(buys.map((trade) => trade.politicianId)).size;
  const recencyScore = buys.reduce((sum, trade) => sum + Math.max(0, 20 - daysAgo(trade.transactionDate) * 0.7), 0);
  const sizeScore = buys.reduce((sum, trade) => sum + tradeSizeScore(trade.estimatedValue), 0);
  const committeeScore = buys.some((trade) =>
    trade.politician.committees.some((committee) =>
      `${committee} ${trade.companyName}`.toLowerCase().includes("defense") ||
      `${committee} ${trade.companyName}`.toLowerCase().includes("technology") ||
      `${committee} ${trade.companyName}`.toLowerCase().includes("health")
    )
  ) ? 12 : 0;
  const clusterScore = uniqueBuyers >= 3 ? 16 : uniqueBuyers === 2 ? 8 : 0;
  const sellPenalty = trades.filter((trade) => trade.tradeType === "SELL").length * 6;

  return clamp(uniqueBuyers * 14 + recencyScore + sizeScore + committeeScore + clusterScore - sellPenalty);
}

export function scoreFundamentalGrowth(fundamentals?: StockFundamentals | null) {
  if (!fundamentals) return 45;

  const revenue = safe(fundamentals.revenueGrowthYoY) * 120;
  const cagr = safe(fundamentals.revenueCagr3Y) * 80;
  const earnings = safe(fundamentals.netIncomeGrowthYoY) * 75;
  const eps = safe(fundamentals.epsGrowthYoY) * 50;
  const operating = safe(fundamentals.operatingIncomeGrowth) * 45;
  const lossPenalty = fundamentals.revenueGrowthYoY > 0.15 && fundamentals.netMargin < -0.05 ? 18 : 0;

  return clamp(45 + revenue + cagr + earnings + eps + operating - lossPenalty);
}

export function scoreProfitabilityAndMargins(fundamentals?: StockFundamentals | null) {
  if (!fundamentals) return 45;

  const marginBlend =
    safe(fundamentals.grossMargin) * 35 +
    safe(fundamentals.operatingMargin) * 45 +
    safe(fundamentals.netMargin) * 50;
  const cashFlowBonus = Number(fundamentals.freeCashFlow ?? 0) > 0 ? 10 : -10;
  const roicBonus = safe(fundamentals.roic) * 35;

  return clamp(40 + marginBlend + cashFlowBonus + roicBonus);
}

export function scoreValuation(fundamentals?: StockFundamentals | null) {
  if (!fundamentals) return 50;

  let score = 80;
  score -= Math.max(0, safe(fundamentals.priceToSales) - 6) * 3;
  score -= Math.max(0, safe(fundamentals.forwardPriceToSales) - 5) * 2;
  score -= Math.max(0, safe(fundamentals.priceToEarnings) - 28) * 0.8;
  score -= Math.max(0, safe(fundamentals.forwardPriceToEarnings) - 24) * 0.7;
  score -= Math.max(0, safe(fundamentals.evToEbitda) - 18) * 1.1;
  score -= Math.max(0, safe(fundamentals.pegRatio) - 1.8) * 8;

  const growthOffset = safe(fundamentals.revenueGrowthYoY) > 0.25 && safe(fundamentals.netIncomeGrowthYoY) > 0.15 ? 10 : 0;
  return clamp(score + growthOffset);
}

export function scoreMoat(stock: Stock, fundamentals?: StockFundamentals | null, manual?: ManualScoreAdjustment | null) {
  if (manual?.moatScore != null) return clamp(manual.moatScore);

  const sectorTailwind = ["Technology", "Healthcare", "Industrials", "Energy"].includes(stock.sector) ? 12 : 5;
  const rdScore = safe(fundamentals?.rdToRevenue) * 120;
  const scaleScore = Number(stock.marketCap ?? 0) > 100_000_000_000 ? 18 : Number(stock.marketCap ?? 0) > 20_000_000_000 ? 10 : 4;
  const marginSignal = safe(fundamentals?.grossMargin) > 0.55 ? 12 : 4;

  return clamp(35 + sectorTailwind + rdScore + scaleScore + marginSignal);
}

export function scoreDebtAndCashFlow(fundamentals?: StockFundamentals | null) {
  if (!fundamentals) return 50;
  const debtPenalty = Math.max(0, safe(fundamentals.debtToEquity) - 1.2) * 15;
  const fcfScore = Number(fundamentals.freeCashFlow ?? 0) > 0 ? 18 : -18;
  const coverageScore = safe(fundamentals.interestCoverage) > 8 ? 14 : safe(fundamentals.interestCoverage) > 3 ? 6 : -8;
  return clamp(55 + fcfScore + coverageScore - debtPenalty);
}

export function scoreCatalystMacro(
  catalysts: Catalyst[],
  macro?: MacroIndicator | null,
  manual?: ManualScoreAdjustment | null
) {
  const catalystBase = catalysts.length ? catalysts.reduce((sum, item) => sum + item.score, 0) / catalysts.length : 45;
  const manualCatalyst = manual?.catalystScore ?? catalystBase;
  const macroScore = manual?.macroScore ?? macro?.score ?? 50;
  return clamp(manualCatalyst * 0.6 + macroScore * 0.4);
}

export function calculateRanking(input: RankingInput) {
  const weights = input.weights ?? defaultWeights;
  const politicianActivityScore = scorePoliticianActivity(input.trades);
  const fundamentalGrowthScore = scoreFundamentalGrowth(input.fundamentals);
  const profitabilityMarginScore = scoreProfitabilityAndMargins(input.fundamentals);
  const valuationScore = scoreValuation(input.fundamentals);
  const moatScore = scoreMoat(input.stock, input.fundamentals, input.manualAdjustment);
  const catalystMacroScore = scoreCatalystMacro(input.catalysts, input.macro, input.manualAdjustment);

  // Debt and management quality influence the related buckets before the final weighted blend.
  const debtCashFlowScore = scoreDebtAndCashFlow(input.fundamentals);
  const managementScore = input.manualAdjustment?.managementScore ?? clamp(50 + safe(input.fundamentals?.roic) * 50 - safe(input.fundamentals?.dilutionRate) * 100);
  const adjustedProfitability = clamp(profitabilityMarginScore * 0.7 + debtCashFlowScore * 0.2 + managementScore * 0.1);

  const finalScore = clamp(
    politicianActivityScore * weights.politicianActivity +
    fundamentalGrowthScore * weights.fundamentalGrowth +
    adjustedProfitability * weights.profitabilityMargin +
    valuationScore * weights.valuation +
    moatScore * weights.moat +
    catalystMacroScore * weights.catalystMacro
  );

  return {
    politicianActivityScore,
    fundamentalGrowthScore,
    profitabilityMarginScore: adjustedProfitability,
    valuationScore,
    moatScore,
    catalystMacroScore,
    finalScore,
    breakdown: {
      weights,
      debtCashFlowScore,
      managementScore,
      inputs: {
        tradeCount: input.trades.length,
        catalystCount: input.catalysts.length,
        sector: input.stock.sector
      }
    }
  };
}
