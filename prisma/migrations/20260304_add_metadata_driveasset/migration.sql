-- Migration: add_metadata_driveasset
-- Adds metadata payload persistence for auto-classified Drive assets (Bloque 4)

ALTER TABLE "DriveAsset" ADD COLUMN "metadata" TEXT DEFAULT '{}';
