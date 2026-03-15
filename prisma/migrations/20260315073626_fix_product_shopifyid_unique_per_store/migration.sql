/*
  Warnings:

  - A unique constraint covering the columns `[shopifyId,storeId]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Product_shopifyId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Product_shopifyId_storeId_key" ON "Product"("shopifyId", "storeId");
