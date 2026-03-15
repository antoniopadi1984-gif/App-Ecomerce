-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DriveAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "storeId" TEXT,
    "driveFileId" TEXT NOT NULL,
    "driveUrl" TEXT,
    "drivePath" TEXT NOT NULL,
    "fileName" TEXT,
    "mimeType" TEXT,
    "assetType" TEXT NOT NULL,
    "fileType" TEXT,
    "conceptCode" TEXT,
    "funnelStage" TEXT,
    "awarenessLevel" INTEGER,
    "traffic" TEXT,
    "angle" TEXT,
    "hookScore" REAL,
    "transcription" TEXT,
    "nomenclature" TEXT,
    "sourceUrl" TEXT,
    "category" TEXT,
    "subcategory" TEXT,
    "concept" INTEGER,
    "organized" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" DATETIME,
    "agentReadable" BOOLEAN NOT NULL DEFAULT true,
    "analysisJson" TEXT,
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
CREATE INDEX "DriveAsset_productId_conceptCode_idx" ON "DriveAsset"("productId", "conceptCode");
CREATE INDEX "DriveAsset_storeId_conceptCode_idx" ON "DriveAsset"("storeId", "conceptCode");
CREATE INDEX "DriveAsset_productId_organized_idx" ON "DriveAsset"("productId", "organized");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
