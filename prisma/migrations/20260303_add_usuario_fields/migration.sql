-- Migration: add_usuario_fields
-- Adds extended Profile fields to the User table to support the Usuario domain model.
-- All new columns are nullable or have defaults so existing rows are not affected.

ALTER TABLE "User" ADD COLUMN "nombre"      TEXT;
ALTER TABLE "User" ADD COLUMN "apellido"    TEXT;
ALTER TABLE "User" ADD COLUMN "rol"         TEXT NOT NULL DEFAULT 'visor';
ALTER TABLE "User" ADD COLUMN "tipo"        TEXT NOT NULL DEFAULT 'humano';
ALTER TABLE "User" ADD COLUMN "estado"      TEXT NOT NULL DEFAULT 'activo';
ALTER TABLE "User" ADD COLUMN "avatar"      TEXT;
ALTER TABLE "User" ADD COLUMN "color"       TEXT NOT NULL DEFAULT '#64748b';
ALTER TABLE "User" ADD COLUMN "invitadoPor" TEXT;

-- Index for fast filtering by estado + rol (used by /api/equipo/gestores)
CREATE INDEX IF NOT EXISTS "User_estado_rol_idx" ON "User"("estado", "rol");
