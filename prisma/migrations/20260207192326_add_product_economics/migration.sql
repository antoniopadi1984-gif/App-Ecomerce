-- AlterTable
ALTER TABLE "Product" ADD COLUMN "breakevenCPC" REAL;
ALTER TABLE "Product" ADD COLUMN "breakevenROAS" REAL;
ALTER TABLE "Product" ADD COLUMN "desiredPrice" REAL;
ALTER TABLE "Product" ADD COLUMN "pricingOffers" TEXT;
ALTER TABLE "Product" ADD COLUMN "targetMargin" REAL DEFAULT 40;
