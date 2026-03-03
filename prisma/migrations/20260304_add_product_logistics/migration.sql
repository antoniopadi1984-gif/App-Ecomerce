-- Migration: add_product_logistics
-- Adds extended logistics fields to Product model for Breakeven calculation

ALTER TABLE "Product" ADD COLUMN "fulfillment" TEXT DEFAULT 'Manual';
ALTER TABLE "Product" ADD COLUMN "deliveryRate" REAL DEFAULT 70;
ALTER TABLE "Product" ADD COLUMN "returnRate" REAL DEFAULT 5;
