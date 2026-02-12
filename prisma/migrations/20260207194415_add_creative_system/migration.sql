-- CreateTable
CREATE TABLE "Avatar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "gender" TEXT,
    "age" INTEGER,
    "ethnicity" TEXT,
    "styleJson" TEXT,
    "voiceId" TEXT,
    "language" TEXT NOT NULL DEFAULT 'es',
    "tone" TEXT,
    "avatarImageUrl" TEXT,
    "avatarModelUrl" TEXT,
    "researchDataJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Avatar_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Creative" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subtype" TEXT,
    "title" TEXT,
    "scriptText" TEXT,
    "scriptFramework" TEXT,
    "assetUrl" TEXT,
    "thumbnailUrl" TEXT,
    "duration" INTEGER,
    "dimensions" TEXT,
    "format" TEXT,
    "avatarId" TEXT,
    "funnelStage" TEXT,
    "targetAudience" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "performanceScore" REAL,
    "driveFolderId" TEXT,
    "driveFileId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Creative_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Creative_avatarId_fkey" FOREIGN KEY ("avatarId") REFERENCES "Avatar" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CreativeTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "funnelStage" TEXT,
    "templateJson" TEXT NOT NULL,
    "previewUrl" TEXT,
    "requiredFields" TEXT,
    "supportedFormats" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ScriptLibrary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT,
    "framework" TEXT NOT NULL,
    "funnelStage" TEXT NOT NULL,
    "hook" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "cta" TEXT NOT NULL,
    "duration" INTEGER,
    "wordCount" INTEGER,
    "conversionRate" REAL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "avgCTR" REAL,
    "avgCPC" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScriptLibrary_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Avatar_productId_idx" ON "Avatar"("productId");

-- CreateIndex
CREATE INDEX "Avatar_type_idx" ON "Avatar"("type");

-- CreateIndex
CREATE INDEX "Creative_productId_idx" ON "Creative"("productId");

-- CreateIndex
CREATE INDEX "Creative_funnelStage_idx" ON "Creative"("funnelStage");

-- CreateIndex
CREATE INDEX "Creative_status_idx" ON "Creative"("status");

-- CreateIndex
CREATE INDEX "Creative_type_idx" ON "Creative"("type");

-- CreateIndex
CREATE INDEX "CreativeTemplate_category_idx" ON "CreativeTemplate"("category");

-- CreateIndex
CREATE INDEX "CreativeTemplate_funnelStage_idx" ON "CreativeTemplate"("funnelStage");

-- CreateIndex
CREATE INDEX "ScriptLibrary_productId_idx" ON "ScriptLibrary"("productId");

-- CreateIndex
CREATE INDEX "ScriptLibrary_framework_idx" ON "ScriptLibrary"("framework");

-- CreateIndex
CREATE INDEX "ScriptLibrary_funnelStage_idx" ON "ScriptLibrary"("funnelStage");
