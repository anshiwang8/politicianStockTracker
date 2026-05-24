-- CreateEnum
CREATE TYPE "Chamber" AS ENUM ('HOUSE', 'SENATE');

-- CreateEnum
CREATE TYPE "Party" AS ENUM ('DEMOCRAT', 'REPUBLICAN', 'INDEPENDENT', 'OTHER');

-- CreateEnum
CREATE TYPE "TradeType" AS ENUM ('BUY', 'SELL', 'EXCHANGE', 'OTHER');

-- CreateEnum
CREATE TYPE "DisclosureSource" AS ENUM ('HOUSE', 'SENATE', 'STOCK_ACT_API', 'MANUAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Politician" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "party" "Party" NOT NULL,
    "chamber" "Chamber" NOT NULL,
    "state" TEXT NOT NULL,
    "committees" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Politician_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stock" (
    "id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "marketCap" DECIMAL(65,30),

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeDisclosure" (
    "id" TEXT NOT NULL,
    "politicianId" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "disclosureDate" TIMESTAMP(3) NOT NULL,
    "ticker" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "tradeType" "TradeType" NOT NULL,
    "transactionSizeRange" TEXT NOT NULL,
    "estimatedValue" DECIMAL(65,30) NOT NULL,
    "filingUrl" TEXT NOT NULL,
    "source" "DisclosureSource" NOT NULL,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradeDisclosure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockFundamentals" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "revenueGrowthYoY" DOUBLE PRECISION NOT NULL,
    "revenueCagr3Y" DOUBLE PRECISION,
    "netIncomeGrowthYoY" DOUBLE PRECISION NOT NULL,
    "epsGrowthYoY" DOUBLE PRECISION,
    "operatingIncomeGrowth" DOUBLE PRECISION,
    "grossMargin" DOUBLE PRECISION NOT NULL,
    "operatingMargin" DOUBLE PRECISION NOT NULL,
    "netMargin" DOUBLE PRECISION NOT NULL,
    "debtToEquity" DOUBLE PRECISION,
    "netDebt" DECIMAL(65,30),
    "freeCashFlow" DECIMAL(65,30),
    "operatingCashFlow" DECIMAL(65,30),
    "interestCoverage" DOUBLE PRECISION,
    "roic" DOUBLE PRECISION,
    "buybackYield" DOUBLE PRECISION,
    "dilutionRate" DOUBLE PRECISION,
    "priceToSales" DOUBLE PRECISION,
    "forwardPriceToSales" DOUBLE PRECISION,
    "priceToEarnings" DOUBLE PRECISION,
    "forwardPriceToEarnings" DOUBLE PRECISION,
    "evToEbitda" DOUBLE PRECISION,
    "pegRatio" DOUBLE PRECISION,
    "rdToRevenue" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockFundamentals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockPrice" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "close" DECIMAL(65,30) NOT NULL,
    "volume" BIGINT,

    CONSTRAINT "StockPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RankingScore" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "asOf" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "politicianActivityScore" DOUBLE PRECISION NOT NULL,
    "fundamentalGrowthScore" DOUBLE PRECISION NOT NULL,
    "profitabilityMarginScore" DOUBLE PRECISION NOT NULL,
    "valuationScore" DOUBLE PRECISION NOT NULL,
    "moatScore" DOUBLE PRECISION NOT NULL,
    "catalystMacroScore" DOUBLE PRECISION NOT NULL,
    "finalScore" DOUBLE PRECISION NOT NULL,
    "breakdown" JSONB NOT NULL,

    CONSTRAINT "RankingScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Catalyst" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "expectedAt" TIMESTAMP(3),
    "score" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "sourceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Catalyst_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MacroIndicator" (
    "id" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "asOf" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "MacroIndicator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Watchlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "alertMinScore" DOUBLE PRECISION NOT NULL DEFAULT 75,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Watchlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManualScoreAdjustment" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "moatScore" DOUBLE PRECISION,
    "managementScore" DOUBLE PRECISION,
    "catalystScore" DOUBLE PRECISION,
    "macroScore" DOUBLE PRECISION,
    "notes" TEXT,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManualScoreAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Stock_ticker_key" ON "Stock"("ticker");

-- CreateIndex
CREATE INDEX "TradeDisclosure_ticker_idx" ON "TradeDisclosure"("ticker");

-- CreateIndex
CREATE INDEX "TradeDisclosure_transactionDate_idx" ON "TradeDisclosure"("transactionDate");

-- CreateIndex
CREATE INDEX "TradeDisclosure_disclosureDate_idx" ON "TradeDisclosure"("disclosureDate");

-- CreateIndex
CREATE UNIQUE INDEX "StockFundamentals_stockId_fiscalYear_key" ON "StockFundamentals"("stockId", "fiscalYear");

-- CreateIndex
CREATE UNIQUE INDEX "StockPrice_stockId_date_key" ON "StockPrice"("stockId", "date");

-- CreateIndex
CREATE INDEX "RankingScore_finalScore_idx" ON "RankingScore"("finalScore");

-- CreateIndex
CREATE INDEX "RankingScore_asOf_idx" ON "RankingScore"("asOf");

-- CreateIndex
CREATE UNIQUE INDEX "Watchlist_userId_stockId_key" ON "Watchlist"("userId", "stockId");

-- AddForeignKey
ALTER TABLE "TradeDisclosure" ADD CONSTRAINT "TradeDisclosure_politicianId_fkey" FOREIGN KEY ("politicianId") REFERENCES "Politician"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeDisclosure" ADD CONSTRAINT "TradeDisclosure_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockFundamentals" ADD CONSTRAINT "StockFundamentals_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockPrice" ADD CONSTRAINT "StockPrice_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankingScore" ADD CONSTRAINT "RankingScore_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Catalyst" ADD CONSTRAINT "Catalyst_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Watchlist" ADD CONSTRAINT "Watchlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Watchlist" ADD CONSTRAINT "Watchlist_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualScoreAdjustment" ADD CONSTRAINT "ManualScoreAdjustment_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
