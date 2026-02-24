# 🩹 Patch Log: Unificación de Duplicados (Bloque 1.6)

**Fecha:** 2026-02-15
**Estado:** ✅ COMPLETADO
**Build:** ✅ PASS

## Resumen de Cambios

Se han unificado y renombrado archivos críticos que compartían el mismo `basename` pero tenían propósitos diferentes, causando confusión y riesgo de importaciones incorrectas.

### 1. Renombrado de Archivos (File Renames)

| Original | Nuevo Nombre | Propósito |
| :--- | :--- | :--- |
| `src/lib/services/snapshot-service.ts` | `metrics-snapshot-service.ts` | Métricas Financieras y Operativas diarias. |
| `src/lib/research/snapshot-service.ts` | `research-snapshot-service.ts` | Versionado de Research de Productos. |
| `src/lib/research/orchestrator.ts` | `research-orchestrator.ts` | Orquestador de Deep Research. |
| `src/lib/creative/orchestrator.ts` | `creative-orchestrator.ts` | Orquestador de Creativos (Ads, Videos). |
| `src/lib/research/v3-prompts.ts` | `research-v3-prompts.ts` | Prompts específicos para Research. |
| `src/lib/copy/v3-prompts.ts` | `copy-v3-prompts.ts` | Prompts específicos para Copy. |
| `src/lib/gemini.ts` | `gemini-adapter.ts` | Adaptador Legacy de Gemini. |

### 2. Renombrado de Clases (Class Renames)

Para evitar colisiones en auto-imports y búsquedas globales:

- **`SnapshotService`** (en `metrics-snapshot-service.ts`) -> **`MetricsSnapshotService`**
- **`GeminiService`** (en `gemini-adapter.ts`) -> **`GeminiAdapter`**

*Nota: `ResearchSnapshotService` se mantuvo con su nombre original ya que no colisionaba tras los cambios.*

### 3. Actualización de Importaciones

Se actualizaron todas las referencias en el codebase (`src/`):
- Imports absolutos con alias: `@/lib/services/snapshot-service` -> `@/lib/services/metrics-snapshot-service`
- Imports relativos: `./snapshot-service` -> `./metrics-snapshot-service`
- Referencias a Clases: `SnapshotService.method()` -> `MetricsSnapshotService.method()`

### 4. Limpieza

- Se eliminó `src/lib/meta-ads.ts` (archivo sin uso, reemplazado por `src/lib/marketing/meta-ads.ts`).

## Verificación

- **Build Check**: `npm run build` completado exitosamente sin errores de tipos ni módulos no encontrados.
- **Double Rename Check**: Se verificó la inexistencia de artefactos como `MetricsMetricsSnapshotService` o `ResearchResearch...`.
