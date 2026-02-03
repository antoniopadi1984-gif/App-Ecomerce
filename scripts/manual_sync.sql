
-- Core Job System
CREATE TABLE IF NOT EXISTS "Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payload" TEXT,
    "result" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "lockedAt" DATETIME,
    "lastError" TEXT,
    "runAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Ads Metrics
CREATE TABLE IF NOT EXISTS "AdMetricDaily" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "platform" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT,
    "metricsRaw" TEXT NOT NULL,
    "metricsNorm" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdMetricDaily_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "CreativeDailyStat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creativeAssetId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "spend" REAL NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "video_3s_views" INTEGER NOT NULL DEFAULT 0,
    "video_50pct_views" INTEGER NOT NULL DEFAULT 0,
    "landing_page_views" INTEGER NOT NULL DEFAULT 0,
    "add_to_cart" INTEGER NOT NULL DEFAULT 0,
    "initiate_checkout" INTEGER NOT NULL DEFAULT 0,
    "purchases" INTEGER NOT NULL DEFAULT 0,
    "revenue" REAL NOT NULL DEFAULT 0,
    "delivered_orders" INTEGER NOT NULL DEFAULT 0,
    "real_revenue" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CreativeDailyStat_creativeAssetId_fkey" FOREIGN KEY ("creativeAssetId") REFERENCES "CreativeAsset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CommentGuard PRO
CREATE TABLE IF NOT EXISTS "SocialAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pictureUrl" TEXT,
    "moderationMode" TEXT NOT NULL DEFAULT 'MANUAL',
    "accessToken" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SocialAccount_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "SocialPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "socialAccountId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "permalink" TEXT,
    "caption" TEXT,
    "type" TEXT,
    "rawJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SocialPost_socialAccountId_fkey" FOREIGN KEY ("socialAccountId") REFERENCES "SocialAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "SocialComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "parentId" TEXT,
    "authorName" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "sentiment" TEXT,
    "intent" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'LOW',
    "status" TEXT NOT NULL DEFAULT 'VISIBLE',
    "isReplied" BOOLEAN NOT NULL DEFAULT 0,
    "rawJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SocialComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocialPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "SocialAction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "commentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "userId" TEXT,
    "payload" TEXT,
    "externalId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SocialAction_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "SocialComment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ModerationRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT 1,
    "conditions" TEXT NOT NULL,
    "actions" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ModerationRule_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "AgentProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Customer Success',
    "tone" TEXT,
    "rules" TEXT,
    "signature" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AgentProfile_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Indices
CREATE UNIQUE INDEX IF NOT EXISTS "AdMetricDaily_storeId_platform_level_externalId_date_key" ON "AdMetricDaily"("storeId", "platform", "level", "externalId", "date");
CREATE UNIQUE INDEX IF NOT EXISTS "CreativeDailyStat_creativeAssetId_date_key" ON "CreativeDailyStat"("creativeAssetId", "date");
CREATE UNIQUE INDEX IF NOT EXISTS "SocialAccount_storeId_platform_externalId_key" ON "SocialAccount"("storeId", "platform", "externalId");
CREATE UNIQUE INDEX IF NOT EXISTS "SocialPost_externalId_key" ON "SocialPost"("externalId");
CREATE UNIQUE INDEX IF NOT EXISTS "SocialComment_externalId_key" ON "SocialComment"("externalId");
CREATE UNIQUE INDEX IF NOT EXISTS "AgentProfile_storeId_key" ON "AgentProfile"("storeId");

-- Alertas y Umbrales
CREATE TABLE IF NOT EXISTS "ThresholdConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'GLOBAL',
    "scenarioName" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "validFrom" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" DATETIME,
    "minProfitPercent" REAL NOT NULL DEFAULT 20.0,
    "minRoas" REAL NOT NULL DEFAULT 0.0,
    "minDeliveryRate" REAL NOT NULL DEFAULT 0.0,
    "minConfirmRate" REAL NOT NULL DEFAULT 0.0,
    "maxIncidenceRate" REAL NOT NULL DEFAULT 100.0,
    "minRecoveryRate" REAL NOT NULL DEFAULT 0.0,
    "maxReturnRate" REAL NOT NULL DEFAULT 100.0,
    "maxCpc" REAL,
    "maxCpa" REAL,
    "criticalKpis" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ThresholdConfig_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Snapshots Diarios
CREATE TABLE IF NOT EXISTS "DailySnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "thresholdId" TEXT,
    "spendAds" REAL NOT NULL DEFAULT 0,
    "revenueReal" REAL NOT NULL DEFAULT 0,
    "costsReal" REAL NOT NULL DEFAULT 0,
    "netProfit" REAL NOT NULL DEFAULT 0,
    "roasReal" REAL NOT NULL DEFAULT 0,
    "deliveryRate" REAL NOT NULL DEFAULT 0,
    "incidenceRate" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'NEUTRAL',
    "isComplete" BOOLEAN NOT NULL DEFAULT 0,
    "metricsJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DailySnapshot_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DailySnapshot_thresholdId_fkey" FOREIGN KEY ("thresholdId") REFERENCES "ThresholdConfig" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "DailySnapshot_storeId_date_key" ON "DailySnapshot"("storeId", "date");

-- Truth Layer & Logistics Map
CREATE TABLE IF NOT EXISTS "ProviderStatusMap" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "rawStatus" TEXT NOT NULL,
    "normalizedStatus" TEXT NOT NULL,
    "labelEs" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "isFinal" BOOLEAN NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProviderStatusMap_provider_rawStatus_key" ON "ProviderStatusMap"("provider", "rawStatus");

-- Update DailySnapshot
-- We wrap this in a safe block or just ignore error if column exists in the script logic context, 
-- but for raw SQL we just attempt it. If it fails due to duplicate column, it ignores in some sqlite tools or fails.
-- Given I am applying new changes, I'll assume it's needed.
ALTER TABLE "DailySnapshot" ADD COLUMN "dataCompleteness" TEXT DEFAULT '{}';
