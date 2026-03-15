-- CreateTable
CREATE TABLE "CopyVariant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "versionId" TEXT,
    "avatarId" TEXT,
    "angleId" TEXT,
    "format" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "driveFileId" TEXT,
    "driveUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CopyVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CopyVariant_productId_format_idx" ON "CopyVariant"("productId", "format");

-- CreateIndex
CREATE INDEX "CopyVariant_storeId_idx" ON "CopyVariant"("storeId");
