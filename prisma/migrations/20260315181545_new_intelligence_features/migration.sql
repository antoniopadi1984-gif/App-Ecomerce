-- CreateTable
CREATE TABLE "ViralityScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creativeAssetId" TEXT NOT NULL,
    "predictedCtr" REAL NOT NULL,
    "predictedRoas" REAL NOT NULL,
    "confidence" REAL NOT NULL,
    "basedOnSamples" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ViralityScore_creativeAssetId_fkey" FOREIGN KEY ("creativeAssetId") REFERENCES "CreativeAsset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "currentStock" INTEGER NOT NULL,
    "dailyVelocity" REAL NOT NULL,
    "daysLeft" INTEGER NOT NULL,
    "leadTimeDays" INTEGER NOT NULL DEFAULT 14,
    "alertSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockAlert_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CustomerLTV" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "predictedLtv12m" REAL NOT NULL,
    "rfmScore" REAL NOT NULL,
    "segment" TEXT NOT NULL,
    "lastCalculated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomerLTV_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BudgetAllocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "currentBudget" REAL NOT NULL,
    "suggestedBudget" REAL NOT NULL,
    "reason" TEXT NOT NULL,
    "roasActual" REAL NOT NULL,
    "roasTarget" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "ViralityScore_creativeAssetId_key" ON "ViralityScore"("creativeAssetId");

-- CreateIndex
CREATE INDEX "StockAlert_productId_idx" ON "StockAlert"("productId");

-- CreateIndex
CREATE INDEX "StockAlert_storeId_daysLeft_idx" ON "StockAlert"("storeId", "daysLeft");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerLTV_customerId_key" ON "CustomerLTV"("customerId");

-- CreateIndex
CREATE INDEX "CustomerLTV_storeId_segment_idx" ON "CustomerLTV"("storeId", "segment");

-- CreateIndex
CREATE INDEX "BudgetAllocation_storeId_idx" ON "BudgetAllocation"("storeId");
