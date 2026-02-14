# 📚 Índice Documentación — Ecombom Control

> Última actualización: 2026-02-14
>
> Script de renombrado: `npx tsx scripts/rename-docs-by-date.ts [YYYY-MM-DD]`

---

## Fase 0 — Base del Sistema

| Documento | Fecha | Tipo |
|---|---|---|
| `FASE0_INVENTARIO__2026-02-14.md` | 2026-02-14 | Inventario técnico |
| `FEATURE_MAP__2026-02-14.md` | 2026-02-14 | Feature audit |
| `PRODUCTO_LIMPIO__2026-02-14.md` | 2026-02-14 | Seed validación |
| `DIAGNOSTICO_PRODUCTO__2026-02-14.md` | 2026-02-14 | Diagnóstico producto |
| `CONEXIONES_ESTANDAR__2026-02-14.md` | 2026-02-14 | Conexiones test |
| `AUDITORIA__2026-02-14.md` | 2026-02-14 | Sistema auditoría |

---

## Pre-Fase 0 — Documentación Heredada

| Documento | Fecha | Tipo |
|---|---|---|
| `DEPENDENCIAS__2026-02-14.md` | 2026-02-14 | Infraestructura |
| `REALIDAD__2026-02-14.md` | 2026-02-14 | Estado del sistema |
| `SYSTEM_AUDIT__2026-02-14.md` | 2026-02-14 | Auditoría sistema |
| `AUDIT_COMPLETE__2026-02-14.md` | 2026-02-14 | Auditoría completa |
| `CREATIVE_LAB_AUDIT__2026-02-14.md` | 2026-02-14 | Auditoría Creative Lab |
| `LEGACY_FILES_REPORT__2026-02-14.md` | 2026-02-14 | Reporte archivos legacy |
| `MIGRATION_PLAN__2026-02-14.md` | 2026-02-14 | Plan de migración |
| `MIGRATION_REPORT__2026-02-14.md` | 2026-02-14 | Reporte de migración |

---

## Históricos

(Versiones anteriores si existen)

---

## Convenciones

- **Formato**: `NOMBRE_DOC__YYYY-MM-DD.md` (doble guion bajo antes de fecha)
- **Índice**: este archivo (`DOC_INDEX.md`) no se renombra — es el punto de entrada permanente
- **Versionado**: se crean nuevas versiones con fecha nueva, no se sobreescriben las existentes

## Uso SaaS

| Propósito | Detalle |
|---|---|
| Versionado auditorías | Cada auditoría fechada permite comparar entre fases |
| Historial técnico | Timeline de decisiones por fecha |
| Debug multi-tenant | Saber qué features existían en qué momento |
| Comparar fases | Diff entre `FEATURE_MAP__2026-02-14.md` vs `FEATURE_MAP__2026-03-01.md` |
| Compliance / ISO | Registro auditable con timestamps |
