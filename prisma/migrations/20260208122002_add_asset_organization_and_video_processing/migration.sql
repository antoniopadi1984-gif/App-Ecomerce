-- AlterTable
ALTER TABLE "Product" ADD COLUMN "productFamily" TEXT;

-- CreateTable
CREATE TABLE "GeneratedCreative" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT,
    "storeId" TEXT,
    "type" TEXT NOT NULL,
    "stage" TEXT,
    "avatarUrl" TEXT,
    "audioUrl" TEXT,
    "videoUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "captionsUrl" TEXT,
    "concept" TEXT NOT NULL,
    "script" TEXT,
    "prompt" TEXT,
    "generatedBy" TEXT NOT NULL DEFAULT 'creative-factory',
    "generationCost" REAL NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "ctr" REAL,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "spend" REAL NOT NULL DEFAULT 0,
    "revenue" REAL NOT NULL DEFAULT 0,
    "qualityScore" REAL,
    "userRating" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'GENERATED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GeneratedCreative_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "GeneratedCreative_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AgentPromptLibrary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "description" TEXT,
    "successRate" REAL NOT NULL DEFAULT 0.5,
    "timesUsed" INTEGER NOT NULL DEFAULT 0,
    "avgQualityScore" REAL,
    "avgCTR" REAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AgentLearning" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentType" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "creativeId" TEXT,
    "inputData" TEXT NOT NULL,
    "outputData" TEXT NOT NULL,
    "promptUsed" TEXT NOT NULL,
    "userFeedback" TEXT,
    "qualityScore" REAL,
    "performanceData" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "CompetitiveAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "competitorName" TEXT NOT NULL,
    "competitorUrl" TEXT,
    "price" REAL,
    "rating" REAL,
    "reviewCount" INTEGER,
    "strengths" TEXT NOT NULL,
    "weaknesses" TEXT NOT NULL,
    "gapOpportunity" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompetitiveAnalysis_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OfferStack" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "components" TEXT NOT NULL,
    "totalValue" REAL NOT NULL,
    "price" REAL NOT NULL,
    "discount" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OfferStack_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VOCInsight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "researchRunId" TEXT,
    "phrase" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "emotionalIntensity" INTEGER NOT NULL,
    "funnelStage" TEXT,
    "frequency" INTEGER NOT NULL DEFAULT 1,
    "verbatimSource" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VOCInsight_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DriveAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "driveFileId" TEXT NOT NULL,
    "drivePath" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "category" TEXT,
    "subcategory" TEXT,
    "concept" INTEGER,
    "organized" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    CONSTRAINT "DriveAsset_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_DriveAsset" ("assetType", "createdAt", "createdBy", "driveFileId", "drivePath", "id", "productId", "sourceUrl") SELECT "assetType", "createdAt", "createdBy", "driveFileId", "drivePath", "id", "productId", "sourceUrl" FROM "DriveAsset";
DROP TABLE "DriveAsset";
ALTER TABLE "new_DriveAsset" RENAME TO "DriveAsset";
CREATE UNIQUE INDEX "DriveAsset_driveFileId_key" ON "DriveAsset"("driveFileId");
CREATE INDEX "DriveAsset_productId_assetType_idx" ON "DriveAsset"("productId", "assetType");
CREATE INDEX "DriveAsset_productId_organized_idx" ON "DriveAsset"("productId", "organized");
CREATE INDEX "DriveAsset_productId_concept_idx" ON "DriveAsset"("productId", "concept");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "CompetitiveAnalysis_productId_idx" ON "CompetitiveAnalysis"("productId");

-- CreateIndex
CREATE INDEX "OfferStack_productId_idx" ON "OfferStack"("productId");

-- CreateIndex
CREATE INDEX "VOCInsight_productId_idx" ON "VOCInsight"("productId");

-- CreateIndex
CREATE INDEX "VOCInsight_category_idx" ON "VOCInsight"("category");
