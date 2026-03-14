/*
  Warnings:

  - You are about to drop the column `angle` on the `CompetitorLanding` table. All the data in the column will be lost.
  - You are about to drop the column `avatar` on the `CompetitorLanding` table. All the data in the column will be lost.
  - You are about to drop the column `awareness` on the `CompetitorLanding` table. All the data in the column will be lost.
  - You are about to drop the column `cta` on the `CompetitorLanding` table. All the data in the column will be lost.
  - You are about to drop the column `objectionsTreated` on the `CompetitorLanding` table. All the data in the column will be lost.
  - You are about to drop the column `opportunityScore` on the `CompetitorLanding` table. All the data in the column will be lost.
  - You are about to drop the column `promise` on the `CompetitorLanding` table. All the data in the column will be lost.
  - You are about to drop the column `risks` on the `CompetitorLanding` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `CompetitorLanding` table. All the data in the column will be lost.
  - You are about to drop the column `structureJson` on the `CompetitorLanding` table. All the data in the column will be lost.
  - You are about to alter the column `metadata` on the `DriveAsset` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - You are about to drop the column `deliveryRate` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `fulfillment` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `returnRate` on the `Product` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[replicatePredictionId]` on the table `Job` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `storeId` to the `CompetitorLanding` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `CompetitorLanding` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `LandingProject` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_estado_rol_idx";

-- AlterTable
ALTER TABLE "Connection" ADD COLUMN "secretEnc" TEXT;
ALTER TABLE "Connection" ADD COLUMN "secretIv" TEXT;
ALTER TABLE "Connection" ADD COLUMN "secretTag" TEXT;

-- AlterTable
ALTER TABLE "Job" ADD COLUMN "provider" TEXT;
ALTER TABLE "Job" ADD COLUMN "replicatePredictionId" TEXT;

-- AlterTable
ALTER TABLE "ScriptLibrary" ADD COLUMN "semanticDescription" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "activeProductId" TEXT;

-- CreateTable
CREATE TABLE "UserConnection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "secretEnc" TEXT,
    "secretIv" TEXT,
    "secretTag" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AutomationRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AutomationRule_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FinanzasConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "thresholdsJson" TEXT,
    "kpiOrderJson" TEXT,
    "kpiEnabledJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FinanzasConfig_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MetaAdAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MetaAdAccount_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AlertRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "threshold" REAL NOT NULL,
    "label" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AlertRule_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MetaConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "pixelId" TEXT,
    "accessToken" TEXT,
    "campaignId" TEXT,
    "adAccountId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'INACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MetaConfig_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'WHATSAPP',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "lastMessageAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "agentPaused" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Conversation_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResearchSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "configJson" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ResearchSession_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResearchIteration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "runId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "changeLog" TEXT,
    "dataJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResearchIteration_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ResearchRun" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ResearchIteration_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ResearchSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FunnelAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "researchRunId" TEXT,
    "awarenessLevel" TEXT NOT NULL,
    "mechanismType" TEXT NOT NULL,
    "strategyJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FunnelAnalysis_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductBranding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "palette" TEXT,
    "typography" TEXT,
    "visualStyle" TEXT,
    "packagingDir" TEXT,
    "landingLayout" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductBranding_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CreativeBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT,
    "storeId" TEXT,
    "type" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'balanced',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "budgetMax" REAL,
    "costEstimate" REAL NOT NULL DEFAULT 0,
    "costActual" REAL NOT NULL DEFAULT 0,
    "maxFailures" INTEGER NOT NULL DEFAULT 5,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "metadataJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CreativeBatch_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CreativeBatch_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CreativeJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchId" TEXT NOT NULL,
    "replicatePredictionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payloadJson" TEXT,
    "resultJson" TEXT,
    "costEstimate" REAL NOT NULL DEFAULT 0,
    "costActual" REAL NOT NULL DEFAULT 0,
    "error" TEXT,
    "terminalAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CreativeJob_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "CreativeBatch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScoreCardConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "metrics" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ScoreCardConfig_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Concept" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "angle" TEXT,
    "awarenessLevel" INTEGER,
    "funnelStage" TEXT NOT NULL DEFAULT 'TOF',
    "number" INTEGER DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'TESTING',
    "createdBy" TEXT NOT NULL DEFAULT 'HUMAN',
    "hypothesis" TEXT,
    "emotion" TEXT,
    "spend" REAL NOT NULL DEFAULT 0,
    "revenue" REAL NOT NULL DEFAULT 0,
    "roas" REAL NOT NULL DEFAULT 0,
    "ctr" REAL NOT NULL DEFAULT 0,
    "cpa" REAL NOT NULL DEFAULT 0,
    "hookRate" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "winnerVariantId" TEXT,
    CONSTRAINT "Concept_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Concept_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ComboMatrix" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "avatarId" TEXT NOT NULL,
    "angleId" TEXT NOT NULL,
    "hookBank" TEXT,
    "painStatements" TEXT,
    "proofAngles" TEXT,
    "ctas" TEXT,
    "funnelStage" TEXT,
    "trafficType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hookBankEs" TEXT,
    CONSTRAINT "ComboMatrix_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PerformanceRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityName" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "week" INTEGER,
    "month" INTEGER,
    "year" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PerformanceRecord_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PerceivedValue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "productId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "avatarId" TEXT,
    "researchRef" TEXT,
    "status" TEXT NOT NULL DEFAULT 'GENERATING',
    "fileUrl" TEXT,
    "coverUrl" TEXT,
    "pagesJson" TEXT,
    "videoUrls" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PerceivedValue_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Automation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "conditions" TEXT,
    "actions" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "runs" INTEGER NOT NULL DEFAULT 0,
    "lastRunAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Automation_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResearchStep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "stepKey" TEXT NOT NULL,
    "inputRefs" TEXT,
    "outputText" TEXT,
    "outputJson" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "translationEs" TEXT,
    CONSTRAINT "ResearchStep_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompetitorAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "country" TEXT,
    "price" REAL,
    "headline" TEXT,
    "offer" TEXT,
    "guarantee" TEXT,
    "socialProof" TEXT,
    "cta" TEXT,
    "pageStructure" TEXT,
    "brandingNotes" TEXT,
    "adLibraryUrls" TEXT,
    "scrapedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompetitorAnalysis_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CompetitorAnalysis_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AmazonReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "rating" REAL,
    "painPoints" TEXT,
    "language" TEXT,
    "objections" TEXT,
    "scrapedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AmazonReview_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DriveFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "productId" TEXT,
    "driveFileId" TEXT NOT NULL,
    "drivePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "conceptCode" TEXT,
    "funnelStage" TEXT,
    "fileType" TEXT NOT NULL,
    "nomenclature" TEXT,
    "sizeBytes" INTEGER,
    "mimeType" TEXT,
    "thumbnailUrl" TEXT,
    "processedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DriveFile_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DriveFile_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DriveFolder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "driveFolderId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DriveFolder_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompetitorBrand" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "productId" TEXT,
    "name" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "trackingActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTracked" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CompetitorBrand_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CompetitorBrand_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompetitorAd" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brandId" TEXT,
    "storeId" TEXT NOT NULL,
    "productId" TEXT,
    "title" TEXT,
    "url" TEXT,
    "videoUrl" TEXT,
    "thumbnailUrl" TEXT,
    "platform" TEXT,
    "status" TEXT,
    "source" TEXT,
    "analysisJson" TEXT,
    "blueprintJson" TEXT,
    "diagnostic" TEXT,
    "framework" TEXT,
    "avatarTarget" TEXT,
    "sellingAngle" TEXT,
    "offerType" TEXT,
    "awarenessLevel" TEXT,
    "firstSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompetitorAd_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CompetitorAd_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CompetitorAd_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "CompetitorBrand" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExtractedAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "landingId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "content" TEXT,
    "url" TEXT,
    "drivePath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExtractedAsset_landingId_fkey" FOREIGN KEY ("landingId") REFERENCES "CompetitorLanding" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InspirationAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "productId" TEXT,
    "type" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "thumbnailUrl" TEXT,
    "driveUrl" TEXT,
    "sourcePlatform" TEXT,
    "label" TEXT,
    "sector" TEXT,
    "emotion" TEXT,
    "hookType" TEXT,
    "semanticDesc" TEXT,
    "analysisJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InspirationAsset_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InspirationAsset_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CreativeArtifact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "avatarId" TEXT,
    "angleId" TEXT,
    "scriptId" TEXT,
    "landingId" TEXT,
    "offerId" TEXT,
    "creativeCode" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "variantSuffix" TEXT,
    "type" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "durationSeconds" INTEGER,
    "funnelStage" TEXT NOT NULL,
    "framework" TEXT NOT NULL,
    "hookType" TEXT NOT NULL,
    "emotion" TEXT NOT NULL,
    "driveUrl" TEXT NOT NULL,
    "driveFileId" TEXT NOT NULL,
    "thumbnailUrl" TEXT NOT NULL,
    "metaAdId" TEXT,
    "metaStatus" TEXT NOT NULL,
    "preLaunchScore" REAL,
    "modelsUsed" TEXT,
    "promptsUsed" TEXT,
    "generationCost" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    "metricsJson" TEXT,
    CONSTRAINT "CreativeArtifact_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CreativeArtifact_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CreativeMetaMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creativeId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "impressions" INTEGER NOT NULL,
    "reach" INTEGER NOT NULL,
    "frequency" REAL NOT NULL,
    "videoThruplayWatched" INTEGER NOT NULL,
    "videoP25Watched" INTEGER NOT NULL,
    "videoP50Watched" INTEGER NOT NULL,
    "videoP75Watched" INTEGER NOT NULL,
    "video2sContinuous" INTEGER NOT NULL,
    "hookRate" REAL NOT NULL,
    "watch25Rate" REAL NOT NULL,
    "watch50Rate" REAL NOT NULL,
    "clicks" INTEGER NOT NULL,
    "linkClicks" INTEGER NOT NULL,
    "ctr" REAL NOT NULL,
    "cpc" REAL NOT NULL,
    "cpm" REAL NOT NULL,
    "conversions" INTEGER NOT NULL,
    "conversionValue" REAL NOT NULL,
    "cvr" REAL NOT NULL,
    "spend" REAL NOT NULL,
    "cpa" REAL NOT NULL,
    "roas" REAL NOT NULL,
    "retentionCurve" TEXT,
    CONSTRAINT "CreativeMetaMetric_creativeId_fkey" FOREIGN KEY ("creativeId") REFERENCES "CreativeArtifact" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SavedHook" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "funnelStage" TEXT NOT NULL,
    "metaHookRate" REAL,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedHook_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SavedHook_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AiAvatar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "avatarCode" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "elevenVoiceId" TEXT NOT NULL,
    "voiceStability" REAL NOT NULL,
    "voiceSimilarity" REAL NOT NULL,
    "voiceStyle" REAL NOT NULL,
    "photoFrontalUrl" TEXT NOT NULL,
    "photo34Url" TEXT NOT NULL,
    "photoLifestyleUrl" TEXT NOT NULL,
    "clipGreetingUrl" TEXT NOT NULL,
    "clipPointingUrl" TEXT NOT NULL,
    "clipsExpressions" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiAvatar_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AiAvatar_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ArtifactEdge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromArtifactId" TEXT NOT NULL,
    "toArtifactId" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ArtifactEdge_toArtifactId_fkey" FOREIGN KEY ("toArtifactId") REFERENCES "CreativeArtifact" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ArtifactEdge_fromArtifactId_fkey" FOREIGN KEY ("fromArtifactId") REFERENCES "CreativeArtifact" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompetitorTracking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "metaPageId" TEXT,
    "trackingActive" BOOLEAN NOT NULL,
    "lastCheckedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompetitorTracking_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CompetitorTracking_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompetitorVideo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "filename" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "previewUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ANALIZANDO',
    "hookDetected" TEXT,
    "hookType" TEXT,
    "framework" TEXT,
    "fase" TEXT,
    "formato" TEXT,
    "duracion" TEXT,
    "idiomaDetectado" TEXT,
    "idiomaDestino" TEXT,
    "analysisJson" TEXT,
    "voiceoverScript" TEXT,
    "tomasCount" INTEGER NOT NULL DEFAULT 0,
    "vocalsUrl" TEXT,
    "musicUrl" TEXT,
    "noVocalsUrl" TEXT,
    "googleDriveTomasId" TEXT,
    "voiceoverRemoved" BOOLEAN NOT NULL DEFAULT false,
    "libraryId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CompetitorVideo_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "competitor_libraries" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CompetitorVideo_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CompetitorVideo_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "competitor_libraries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "productId" TEXT,
    "advertiserId" TEXT,
    "advertiserUrl" TEXT NOT NULL,
    "advertiserName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adCount" INTEGER NOT NULL DEFAULT 0,
    "platform" TEXT NOT NULL DEFAULT 'META',
    "lastSyncAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "competitor_libraries_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "competitor_libraries_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "landing_clones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "productId" TEXT,
    "originalUrl" TEXT NOT NULL,
    "clonedUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "assetsJson" TEXT,
    "screenshotUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "landing_clones_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "landing_clones_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "extension_captures" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "productId" TEXT,
    "userId" TEXT,
    "url" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "assetUrl" TEXT NOT NULL,
    "localPath" TEXT,
    "metadata" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SAVED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "audioJson" TEXT,
    "cleanedUrl" TEXT,
    CONSTRAINT "extension_captures_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "extension_captures_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "extension_captures_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "media_jobs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "captureId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "totalSteps" INTEGER NOT NULL DEFAULT 0,
    "stepsLog" TEXT,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "media_jobs_captureId_fkey" FOREIGN KEY ("captureId") REFERENCES "extension_captures" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "agent_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "store_id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "system_prompt" TEXT NOT NULL,
    "label" TEXT,
    "description" TEXT,
    "module" TEXT DEFAULT 'sistema',
    "emoji" TEXT DEFAULT '🤖',
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "examples" JSONB,
    "updated_at" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "agent_configs_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "meta_insights_cache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "spend" REAL NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "frequency" REAL NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "cpc" REAL NOT NULL DEFAULT 0,
    "ctr" REAL NOT NULL DEFAULT 0,
    "cpm" REAL NOT NULL DEFAULT 0,
    "results" INTEGER NOT NULL DEFAULT 0,
    "costPerResult" REAL NOT NULL DEFAULT 0,
    "roas" REAL NOT NULL DEFAULT 0,
    "hookRate" REAL NOT NULL DEFAULT 0,
    "holdRate" REAL NOT NULL DEFAULT 0,
    "date" DATETIME NOT NULL,
    "metadata" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "bidStrategy" TEXT,
    "budget" REAL,
    "deliveryVerdict" TEXT,
    "objective" TEXT,
    CONSTRAINT "meta_insights_cache_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "config" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assignedTo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "dueDate" DATETIME,
    "completedAt" DATETIME,
    "orderId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AgentProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEDIA_BUYING',
    "instructions" TEXT NOT NULL DEFAULT '',
    "tone" TEXT NOT NULL DEFAULT 'professional',
    "channels" TEXT NOT NULL DEFAULT '[]',
    "menus" TEXT NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "model" TEXT NOT NULL DEFAULT 'gemini-3-flash-preview',
    "temperature" REAL NOT NULL DEFAULT 0.7,
    "systemPrompt" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AgentProfile_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AgentProfile" ("channels", "createdAt", "id", "instructions", "isActive", "menus", "name", "role", "storeId", "tone", "updatedAt") SELECT "channels", "createdAt", "id", "instructions", "isActive", "menus", "name", "role", "storeId", "tone", "updatedAt" FROM "AgentProfile";
DROP TABLE "AgentProfile";
ALTER TABLE "new_AgentProfile" RENAME TO "AgentProfile";
CREATE TABLE "new_AvatarAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "avatarProfileId" TEXT NOT NULL,
    "productId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'AVATAR_IMAGE',
    "url" TEXT,
    "pathLocal" TEXT,
    "driveFileId" TEXT,
    "mime" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processingStatus" TEXT DEFAULT 'PENDING',
    "semanticDescription" TEXT,
    CONSTRAINT "AvatarAsset_avatarProfileId_fkey" FOREIGN KEY ("avatarProfileId") REFERENCES "AvatarProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AvatarAsset" ("avatarProfileId", "createdAt", "driveFileId", "height", "id", "mime", "pathLocal", "type", "width") SELECT "avatarProfileId", "createdAt", "driveFileId", "height", "id", "mime", "pathLocal", "type", "width" FROM "AvatarAsset";
DROP TABLE "AvatarAsset";
ALTER TABLE "new_AvatarAsset" RENAME TO "AvatarAsset";
CREATE TABLE "new_AvatarProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sex" TEXT NOT NULL,
    "ageRange" TEXT,
    "region" TEXT,
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "lastError" TEXT,
    "evolutionId" TEXT,
    "evolutionStage" TEXT,
    "productId" TEXT,
    "metadataJson" TEXT,
    "voiceId" TEXT,
    "voiceProvider" TEXT DEFAULT 'ELEVENLABS',
    "voiceSettings" TEXT,
    "language" TEXT NOT NULL DEFAULT 'es',
    "speed" REAL NOT NULL DEFAULT 1.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "avatarId" TEXT,
    "promptDNA" TEXT,
    CONSTRAINT "AvatarProfile_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AvatarProfile_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AvatarProfile" ("ageRange", "createdAt", "evolutionId", "evolutionStage", "id", "imageUrl", "lastError", "metadataJson", "name", "region", "sex", "status", "storeId", "updatedAt", "videoUrl") SELECT "ageRange", "createdAt", "evolutionId", "evolutionStage", "id", "imageUrl", "lastError", "metadataJson", "name", "region", "sex", "status", "storeId", "updatedAt", "videoUrl" FROM "AvatarProfile";
DROP TABLE "AvatarProfile";
ALTER TABLE "new_AvatarProfile" RENAME TO "AvatarProfile";
CREATE INDEX "AvatarProfile_productId_idx" ON "AvatarProfile"("productId");
CREATE TABLE "new_CompetitorLanding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brandId" TEXT,
    "storeId" TEXT NOT NULL,
    "productId" TEXT,
    "name" TEXT,
    "url" TEXT NOT NULL,
    "screenshotUrl" TEXT,
    "localPath" TEXT,
    "type" TEXT,
    "offerAnalysis" TEXT,
    "visualHierarchy" TEXT,
    "copyAnalysis" TEXT,
    "targetTraffic" TEXT,
    "diagnostic" TEXT,
    "conversionScore" INTEGER,
    "analysisJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CompetitorLanding_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CompetitorLanding_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CompetitorLanding_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "CompetitorBrand" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_CompetitorLanding" ("createdAt", "id", "productId", "screenshotUrl", "type", "url") SELECT "createdAt", "id", "productId", "screenshotUrl", "type", "url" FROM "CompetitorLanding";
DROP TABLE "CompetitorLanding";
ALTER TABLE "new_CompetitorLanding" RENAME TO "CompetitorLanding";
CREATE INDEX "CompetitorLanding_storeId_idx" ON "CompetitorLanding"("storeId");
CREATE TABLE "new_CreativeAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "storeId" TEXT,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "driveUrl" TEXT,
    "nomenclatura" TEXT,
    "editor" TEXT,
    "angulo" TEXT,
    "language" TEXT NOT NULL DEFAULT 'es',
    "spend" REAL NOT NULL DEFAULT 0,
    "revenue" REAL NOT NULL DEFAULT 0,
    "purchases" INTEGER NOT NULL DEFAULT 0,
    "hookRate" REAL,
    "ctr" REAL,
    "verdict" TEXT,
    "conceptId" TEXT,
    "scriptEs" TEXT,
    "conceptCode" TEXT,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "driveFileId" TEXT,
    "drivePath" TEXT,
    "transcription" TEXT,
    "shotlistJson" TEXT,
    "clipsJson" TEXT,
    "hookText" TEXT,
    "funnelStage" TEXT,
    "processingStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "avatarId" TEXT,
    "angleId" TEXT,
    "metaStatus" TEXT DEFAULT 'DRAFT',
    "thumbnailUrl" TEXT,
    "tagsJson" TEXT,
    "semanticDescription" TEXT,
    "format" TEXT,
    "framework" TEXT,
    "dominantEmotion" TEXT,
    "fatigueScore" REAL,
    "fatigueDaysLeft" INTEGER,
    "ctrTrend" TEXT,
    "frequency" REAL,
    "versionGroup" TEXT,
    "sourceAssetId" TEXT,
    "similarityHash" TEXT,
    "isMaster" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CreativeAsset_avatarId_fkey" FOREIGN KEY ("avatarId") REFERENCES "AvatarProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CreativeAsset_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CreativeAsset_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CreativeAsset_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CreativeAsset" ("angulo", "createdAt", "ctr", "driveUrl", "editor", "hookRate", "id", "language", "name", "nomenclatura", "productId", "purchases", "revenue", "spend", "storeId", "type", "verdict") SELECT "angulo", "createdAt", "ctr", "driveUrl", "editor", "hookRate", "id", "language", "name", "nomenclatura", "productId", "purchases", "revenue", "spend", "storeId", "type", "verdict" FROM "CreativeAsset";
DROP TABLE "CreativeAsset";
ALTER TABLE "new_CreativeAsset" RENAME TO "CreativeAsset";
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
    "metadata" JSONB,
    CONSTRAINT "DriveAsset_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_DriveAsset" ("assetType", "category", "concept", "createdAt", "createdBy", "driveFileId", "drivePath", "id", "metadata", "organized", "productId", "sourceUrl", "subcategory") SELECT "assetType", "category", "concept", "createdAt", "createdBy", "driveFileId", "drivePath", "id", "metadata", "organized", "productId", "sourceUrl", "subcategory" FROM "DriveAsset";
DROP TABLE "DriveAsset";
ALTER TABLE "new_DriveAsset" RENAME TO "DriveAsset";
CREATE UNIQUE INDEX "DriveAsset_driveFileId_key" ON "DriveAsset"("driveFileId");
CREATE INDEX "DriveAsset_productId_assetType_idx" ON "DriveAsset"("productId", "assetType");
CREATE INDEX "DriveAsset_productId_organized_idx" ON "DriveAsset"("productId", "organized");
CREATE INDEX "DriveAsset_productId_concept_idx" ON "DriveAsset"("productId", "concept");
CREATE TABLE "new_LandingProject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "productId" TEXT,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "blocksJson" TEXT,
    "styleJson" TEXT,
    "versionsCount" INTEGER NOT NULL DEFAULT 1,
    "previousVersionJson" TEXT,
    "changeLogJson" TEXT,
    "blueprintId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "semanticDescription" TEXT,
    CONSTRAINT "LandingProject_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LandingProject_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_LandingProject" ("blocksJson", "blueprintId", "changeLogJson", "id", "name", "previousVersionJson", "productId", "status", "storeId", "styleJson", "url", "versionsCount") SELECT "blocksJson", "blueprintId", "changeLogJson", "id", "name", "previousVersionJson", "productId", "status", "storeId", "styleJson", "url", "versionsCount" FROM "LandingProject";
DROP TABLE "LandingProject";
ALTER TABLE "new_LandingProject" RENAME TO "LandingProject";
CREATE TABLE "new_Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT,
    "customerContact" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'WHATSAPP',
    "whatsappAccountId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "cost" REAL NOT NULL DEFAULT 0,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "conversationId" TEXT,
    CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Message_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Message_whatsappAccountId_fkey" FOREIGN KEY ("whatsappAccountId") REFERENCES "WhatsAppAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Message" ("channel", "content", "cost", "createdAt", "customerContact", "id", "isRead", "orderId", "sender", "status", "timestamp", "whatsappAccountId") SELECT "channel", "content", "cost", "createdAt", "customerContact", "id", "isRead", "orderId", "sender", "status", "timestamp", "whatsappAccountId" FROM "Message";
DROP TABLE "Message";
ALTER TABLE "new_Message" RENAME TO "Message";
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "customerId" TEXT,
    "shopifyId" TEXT,
    "orderNumber" TEXT,
    "orderType" TEXT NOT NULL DEFAULT 'REGULAR',
    "abandonedId" TEXT,
    "draftId" TEXT,
    "customerName" TEXT,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "customerIp" TEXT,
    "userAgent" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "province" TEXT,
    "zip" TEXT,
    "country" TEXT,
    "addressStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "correctedAddress" TEXT,
    "geolocation" TEXT,
    "lat" REAL,
    "lng" REAL,
    "totalPrice" REAL NOT NULL DEFAULT 0,
    "totalTax" REAL NOT NULL DEFAULT 0,
    "shippingCost" REAL NOT NULL DEFAULT 0,
    "paymentMethod" TEXT NOT NULL DEFAULT 'COD',
    "financialStatus" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "discounts" REAL NOT NULL DEFAULT 0,
    "discountCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "fulfillmentStatus" TEXT,
    "carrier" TEXT,
    "trackingCode" TEXT,
    "shippedAt" DATETIME,
    "deliveredAt" DATETIME,
    "returnedAt" DATETIME,
    "returnReason" TEXT,
    "estimatedLogisticsCost" REAL NOT NULL DEFAULT 0,
    "warehouse" TEXT,
    "priority" TEXT,
    "logisticsProvider" TEXT,
    "trackingUrl" TEXT,
    "logisticsStatus" TEXT,
    "finalStatus" TEXT,
    "confirmationDate" DATETIME,
    "confirmationAttempts" INTEGER NOT NULL DEFAULT 0,
    "incidenceResult" TEXT,
    "incidenceReason" TEXT,
    "incidenceAttempts" INTEGER NOT NULL DEFAULT 0,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "productTitle" TEXT,
    "variantTitle" TEXT,
    "sku" TEXT,
    "units" INTEGER NOT NULL DEFAULT 1,
    "assignedAgentId" TEXT,
    "processedAt" DATETIME,
    "incidenciaType" TEXT,
    "notes" TEXT,
    "shopifyNote" TEXT,
    "tags" TEXT,
    "whatsappSent" BOOLEAN NOT NULL DEFAULT false,
    "msgConfirmationSent" BOOLEAN NOT NULL DEFAULT false,
    "msgTrackingSent" BOOLEAN NOT NULL DEFAULT false,
    "msgDeliverySent" BOOLEAN NOT NULL DEFAULT false,
    "msgIncidenceSent" BOOLEAN NOT NULL DEFAULT false,
    "callAttempt1" TEXT,
    "callAttempt2" TEXT,
    "callAttempt3" TEXT,
    "callRecordingUrl" TEXT,
    "phoneValidated" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "medium" TEXT,
    "campaign" TEXT,
    "content" TEXT,
    "term" TEXT,
    "adsetId" TEXT,
    "adId" TEXT,
    "rawJson" TEXT,
    "shopifyUpdatedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "estimatedProfit" REAL,
    "realProfit" REAL,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" TEXT NOT NULL DEFAULT 'LOW',
    "fraudScore" INTEGER NOT NULL DEFAULT 0,
    "fraudStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "shopifyOrderId" TEXT,
    "fulfillmentCost" REAL DEFAULT 0,
    "netMargin" REAL,
    "netProfit" REAL,
    CONSTRAINT "Order_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("abandonedId", "adId", "addressLine1", "addressLine2", "addressStatus", "adsetId", "assignedAgentId", "callAttempt1", "callAttempt2", "callAttempt3", "callRecordingUrl", "campaign", "carrier", "city", "confirmationAttempts", "confirmationDate", "content", "correctedAddress", "country", "createdAt", "currency", "customerEmail", "customerId", "customerIp", "customerName", "customerPhone", "deliveredAt", "discountCode", "discounts", "draftId", "estimatedLogisticsCost", "estimatedProfit", "finalStatus", "financialStatus", "fulfillmentStatus", "geolocation", "id", "incidenceAttempts", "incidenceReason", "incidenceResult", "incidenciaType", "lat", "lng", "logisticsProvider", "logisticsStatus", "medium", "msgConfirmationSent", "msgDeliverySent", "msgIncidenceSent", "msgTrackingSent", "needsReview", "notes", "orderNumber", "orderType", "paymentMethod", "phoneValidated", "priority", "processedAt", "productTitle", "province", "rawJson", "realProfit", "returnReason", "returnedAt", "riskLevel", "riskScore", "shippedAt", "shippingCost", "shopifyId", "shopifyNote", "shopifyUpdatedAt", "sku", "source", "status", "storeId", "tags", "term", "totalPrice", "totalTax", "trackingCode", "trackingUrl", "units", "updatedAt", "userAgent", "variantTitle", "warehouse", "whatsappSent", "zip") SELECT "abandonedId", "adId", "addressLine1", "addressLine2", "addressStatus", "adsetId", "assignedAgentId", "callAttempt1", "callAttempt2", "callAttempt3", "callRecordingUrl", "campaign", "carrier", "city", "confirmationAttempts", "confirmationDate", "content", "correctedAddress", "country", "createdAt", "currency", "customerEmail", "customerId", "customerIp", "customerName", "customerPhone", "deliveredAt", "discountCode", "discounts", "draftId", "estimatedLogisticsCost", "estimatedProfit", "finalStatus", "financialStatus", "fulfillmentStatus", "geolocation", "id", "incidenceAttempts", "incidenceReason", "incidenceResult", "incidenciaType", "lat", "lng", "logisticsProvider", "logisticsStatus", "medium", "msgConfirmationSent", "msgDeliverySent", "msgIncidenceSent", "msgTrackingSent", "needsReview", "notes", "orderNumber", "orderType", "paymentMethod", "phoneValidated", "priority", "processedAt", "productTitle", "province", "rawJson", "realProfit", "returnReason", "returnedAt", "riskLevel", "riskScore", "shippedAt", "shippingCost", "shopifyId", "shopifyNote", "shopifyUpdatedAt", "sku", "source", "status", "storeId", "tags", "term", "totalPrice", "totalTax", "trackingCode", "trackingUrl", "units", "updatedAt", "userAgent", "variantTitle", "warehouse", "whatsappSent", "zip" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_shopifyId_key" ON "Order"("shopifyId");
CREATE UNIQUE INDEX "Order_abandonedId_key" ON "Order"("abandonedId");
CREATE UNIQUE INDEX "Order_draftId_key" ON "Order"("draftId");
CREATE UNIQUE INDEX "Order_shopifyOrderId_key" ON "Order"("shopifyOrderId");
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "shopifyId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL NOT NULL DEFAULT 0,
    "compareAtPrice" REAL,
    "imageUrl" TEXT,
    "variantId" TEXT,
    "sku" TEXT,
    "unitCost" REAL,
    "inventoryQuantity" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "tags" TEXT,
    "productType" TEXT,
    "vendor" TEXT,
    "handle" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "supplierId" TEXT,
    "handlingCost" REAL DEFAULT 0,
    "returnCost" REAL DEFAULT 0,
    "shippingCost" REAL DEFAULT 0,
    "vatPercent" REAL DEFAULT 21,
    "country" TEXT DEFAULT 'ES',
    "landingUrl" TEXT,
    "niche" TEXT,
    "problemToSolve" TEXT,
    "driveFolderId" TEXT,
    "driveRootPath" TEXT,
    "amazonLinks" TEXT,
    "competitorImages" TEXT,
    "landingUrls" TEXT,
    "productImages" TEXT,
    "breakevenCPC" REAL,
    "breakevenROAS" REAL,
    "desiredPrice" REAL,
    "pricingOffers" TEXT,
    "targetMargin" REAL DEFAULT 40,
    "productFamily" TEXT,
    "driveDocId" TEXT,
    "driveDocUrl" TEXT,
    "isWinnersOnly" BOOLEAN NOT NULL DEFAULT false,
    "marketLanguage" TEXT NOT NULL DEFAULT 'ES',
    "interfaceLanguage" TEXT NOT NULL DEFAULT 'ES',
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "pvpEstimated" REAL,
    "cvrExpected" REAL,
    "cpaMax" REAL,
    "adLibraryUrls" TEXT,
    "foreplayBoardUrl" TEXT,
    "googleDocUrl" TEXT,
    "agentDescription" TEXT,
    "driveSetupDone" BOOLEAN DEFAULT false,
    "driveIndexPath" TEXT,
    CONSTRAINT "Product_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Product_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("amazonLinks", "breakevenCPC", "breakevenROAS", "compareAtPrice", "competitorImages", "country", "createdAt", "description", "desiredPrice", "driveFolderId", "driveRootPath", "handle", "handlingCost", "id", "imageUrl", "inventoryQuantity", "landingUrl", "landingUrls", "niche", "price", "pricingOffers", "problemToSolve", "productFamily", "productImages", "productType", "returnCost", "shippingCost", "shopifyId", "sku", "status", "storeId", "supplierId", "tags", "targetMargin", "title", "unitCost", "updatedAt", "variantId", "vatPercent", "vendor") SELECT "amazonLinks", "breakevenCPC", "breakevenROAS", "compareAtPrice", "competitorImages", "country", "createdAt", "description", "desiredPrice", "driveFolderId", "driveRootPath", "handle", "handlingCost", "id", "imageUrl", "inventoryQuantity", "landingUrl", "landingUrls", "niche", "price", "pricingOffers", "problemToSolve", "productFamily", "productImages", "productType", "returnCost", "shippingCost", "shopifyId", "sku", "status", "storeId", "supplierId", "tags", "targetMargin", "title", "unitCost", "updatedAt", "variantId", "vatPercent", "vendor" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_shopifyId_key" ON "Product"("shopifyId");
CREATE TABLE "new_ProductFinance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "unitCost" REAL NOT NULL DEFAULT 0,
    "sellingPrice" REAL NOT NULL DEFAULT 0,
    "shippingCost" REAL NOT NULL DEFAULT 0,
    "returnCost" REAL NOT NULL DEFAULT 0,
    "taxes" REAL NOT NULL DEFAULT 0,
    "isUpsell" BOOLEAN NOT NULL DEFAULT false,
    "targetCPA" REAL,
    "expectedDeliveryRate" REAL NOT NULL DEFAULT 0.85,
    "packagingCost" REAL NOT NULL DEFAULT 0,
    "codFee" REAL NOT NULL DEFAULT 0,
    "insuranceFee" REAL NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductFinance_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ProductFinance" ("expectedDeliveryRate", "id", "isUpsell", "productId", "returnCost", "sellingPrice", "shippingCost", "targetCPA", "taxes", "unitCost", "updatedAt") SELECT "expectedDeliveryRate", "id", "isUpsell", "productId", "returnCost", "sellingPrice", "shippingCost", "targetCPA", "taxes", "unitCost", "updatedAt" FROM "ProductFinance";
DROP TABLE "ProductFinance";
ALTER TABLE "new_ProductFinance" RENAME TO "ProductFinance";
CREATE UNIQUE INDEX "ProductFinance_productId_key" ON "ProductFinance"("productId");
CREATE TABLE "new_ResearchRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "sessionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "version" TEXT NOT NULL DEFAULT 'V2',
    "currentPhase" INTEGER NOT NULL DEFAULT 0,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "logs" TEXT,
    "results" TEXT,
    "summary" TEXT,
    "avatarMatrix" TEXT,
    "awareness" TEXT,
    "marketMechanism" TEXT,
    "sophistication" TEXT,
    "objectionHeatmap" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResearchRun_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ResearchSession" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ResearchRun_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ResearchRun" ("avatarMatrix", "awareness", "createdAt", "currentPhase", "id", "logs", "marketMechanism", "objectionHeatmap", "productId", "progress", "results", "sophistication", "status", "summary", "updatedAt", "version") SELECT "avatarMatrix", "awareness", "createdAt", "currentPhase", "id", "logs", "marketMechanism", "objectionHeatmap", "productId", "progress", "results", "sophistication", "status", "summary", "updatedAt", "version" FROM "ResearchRun";
DROP TABLE "ResearchRun";
ALTER TABLE "new_ResearchRun" RENAME TO "ResearchRun";
CREATE INDEX "ResearchRun_productId_idx" ON "ResearchRun"("productId");
CREATE INDEX "ResearchRun_status_idx" ON "ResearchRun"("status");
CREATE TABLE "new_Store" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "brandKit" TEXT,
    "swipeFile" TEXT,
    "safeModeAds" BOOLEAN NOT NULL DEFAULT true,
    "aggressiveLandings" BOOLEAN NOT NULL DEFAULT true,
    "nomenclatureTemplate" TEXT NOT NULL DEFAULT '[PROD]_[CONC]_[VAR]_[LANG]',
    "targetProfitMargin" REAL NOT NULL DEFAULT 30.0,
    "adSpendSource" TEXT NOT NULL DEFAULT 'MANUAL',
    "driveRootFolderId" TEXT,
    "storeType" TEXT NOT NULL DEFAULT 'HYBRID',
    "driveSetupDone" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Store" ("adSpendSource", "aggressiveLandings", "brandKit", "currency", "domain", "driveRootFolderId", "id", "name", "nomenclatureTemplate", "safeModeAds", "swipeFile", "targetProfitMargin") SELECT "adSpendSource", "aggressiveLandings", "brandKit", "currency", "domain", "driveRootFolderId", "id", "name", "nomenclatureTemplate", "safeModeAds", "swipeFile", "targetProfitMargin" FROM "Store";
DROP TABLE "Store";
ALTER TABLE "new_Store" RENAME TO "Store";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "UserConnection_userId_provider_key" ON "UserConnection"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "AutomationRule_storeId_ruleId_key" ON "AutomationRule"("storeId", "ruleId");

-- CreateIndex
CREATE UNIQUE INDEX "FinanzasConfig_storeId_key" ON "FinanzasConfig"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "MetaAdAccount_storeId_accountId_key" ON "MetaAdAccount"("storeId", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "MetaConfig_productId_key" ON "MetaConfig"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_externalId_key" ON "Conversation"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductBranding_productId_key" ON "ProductBranding"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "CreativeJob_replicatePredictionId_key" ON "CreativeJob"("replicatePredictionId");

-- CreateIndex
CREATE UNIQUE INDEX "ScoreCardConfig_storeId_key" ON "ScoreCardConfig"("storeId");

-- CreateIndex
CREATE INDEX "PerformanceRecord_storeId_entityType_date_idx" ON "PerformanceRecord"("storeId", "entityType", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ResearchStep_productId_runId_stepKey_version_key" ON "ResearchStep"("productId", "runId", "stepKey", "version");

-- CreateIndex
CREATE INDEX "CompetitorAnalysis_productId_idx" ON "CompetitorAnalysis"("productId");

-- CreateIndex
CREATE INDEX "CompetitorAnalysis_storeId_idx" ON "CompetitorAnalysis"("storeId");

-- CreateIndex
CREATE INDEX "AmazonReview_productId_idx" ON "AmazonReview"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "DriveFile_driveFileId_key" ON "DriveFile"("driveFileId");

-- CreateIndex
CREATE INDEX "DriveFile_storeId_idx" ON "DriveFile"("storeId");

-- CreateIndex
CREATE INDEX "DriveFile_productId_idx" ON "DriveFile"("productId");

-- CreateIndex
CREATE INDEX "DriveFile_conceptCode_idx" ON "DriveFile"("conceptCode");

-- CreateIndex
CREATE UNIQUE INDEX "DriveFolder_driveFolderId_key" ON "DriveFolder"("driveFolderId");

-- CreateIndex
CREATE INDEX "DriveFolder_productId_path_idx" ON "DriveFolder"("productId", "path");

-- CreateIndex
CREATE INDEX "CompetitorBrand_storeId_idx" ON "CompetitorBrand"("storeId");

-- CreateIndex
CREATE INDEX "CompetitorAd_storeId_idx" ON "CompetitorAd"("storeId");

-- CreateIndex
CREATE INDEX "InspirationAsset_storeId_idx" ON "InspirationAsset"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "CreativeArtifact_creativeCode_key" ON "CreativeArtifact"("creativeCode");

-- CreateIndex
CREATE INDEX "CreativeArtifact_storeId_idx" ON "CreativeArtifact"("storeId");

-- CreateIndex
CREATE INDEX "CreativeArtifact_productId_idx" ON "CreativeArtifact"("productId");

-- CreateIndex
CREATE INDEX "CreativeMetaMetric_creativeId_idx" ON "CreativeMetaMetric"("creativeId");

-- CreateIndex
CREATE INDEX "CreativeMetaMetric_date_idx" ON "CreativeMetaMetric"("date");

-- CreateIndex
CREATE INDEX "SavedHook_storeId_idx" ON "SavedHook"("storeId");

-- CreateIndex
CREATE INDEX "SavedHook_productId_idx" ON "SavedHook"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "AiAvatar_avatarCode_key" ON "AiAvatar"("avatarCode");

-- CreateIndex
CREATE INDEX "AiAvatar_storeId_idx" ON "AiAvatar"("storeId");

-- CreateIndex
CREATE INDEX "AiAvatar_productId_idx" ON "AiAvatar"("productId");

-- CreateIndex
CREATE INDEX "ArtifactEdge_fromArtifactId_idx" ON "ArtifactEdge"("fromArtifactId");

-- CreateIndex
CREATE INDEX "ArtifactEdge_toArtifactId_idx" ON "ArtifactEdge"("toArtifactId");

-- CreateIndex
CREATE INDEX "CompetitorTracking_storeId_idx" ON "CompetitorTracking"("storeId");

-- CreateIndex
CREATE INDEX "CompetitorTracking_productId_idx" ON "CompetitorTracking"("productId");

-- CreateIndex
CREATE INDEX "CompetitorVideo_productId_idx" ON "CompetitorVideo"("productId");

-- CreateIndex
CREATE INDEX "CompetitorVideo_storeId_idx" ON "CompetitorVideo"("storeId");

-- CreateIndex
CREATE INDEX "competitor_libraries_storeId_idx" ON "competitor_libraries"("storeId");

-- CreateIndex
CREATE INDEX "competitor_libraries_productId_idx" ON "competitor_libraries"("productId");

-- CreateIndex
CREATE INDEX "landing_clones_storeId_idx" ON "landing_clones"("storeId");

-- CreateIndex
CREATE INDEX "landing_clones_productId_idx" ON "landing_clones"("productId");

-- CreateIndex
CREATE INDEX "extension_captures_storeId_idx" ON "extension_captures"("storeId");

-- CreateIndex
CREATE INDEX "extension_captures_productId_idx" ON "extension_captures"("productId");

-- CreateIndex
CREATE INDEX "extension_captures_userId_idx" ON "extension_captures"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "media_jobs_captureId_key" ON "media_jobs"("captureId");

-- CreateIndex
CREATE UNIQUE INDEX "agent_configs_store_id_agent_id_key" ON "agent_configs"("store_id", "agent_id");

-- CreateIndex
CREATE INDEX "meta_insights_cache_storeId_accountId_level_date_idx" ON "meta_insights_cache"("storeId", "accountId", "level", "date");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_module_key" ON "user_preferences"("userId", "module");

-- CreateIndex
CREATE INDEX "Task_storeId_status_idx" ON "Task"("storeId", "status");

-- CreateIndex
CREATE INDEX "Task_assignedTo_idx" ON "Task"("assignedTo");

-- CreateIndex
CREATE UNIQUE INDEX "Job_replicatePredictionId_key" ON "Job"("replicatePredictionId");
