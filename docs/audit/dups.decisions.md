# 🎯 Decisiones de Unificación de Duplicados

Este documento detalla la estrategia para cada grupo de duplicados detectados por basename. El objetivo es eliminar la ambigüedad y facilitar las importaciones.

## 1. Grupos de Basename (Críticos)

| Grupo | Recurso A | Recurso B | Decisión | Razón |
| :--- | :--- | :--- | :--- | :--- |
| **gemini.ts** | `src/lib/gemini.ts` | `src/lib/ai/providers/gemini.ts` | **Keep Both (Rename Legacy)** | El primero es un Adaptador de Servicio, el segundo es un Proveedor de bajo nivel. |
| **v3-prompts.ts** | `src/lib/copy/v3-prompts.ts` | `src/lib/research/v3-prompts.ts` | **Rename Both** | Contenido específico de módulo. Renombrar con prefijo de dominio. |
| **orchestrator.ts** | `src/lib/creative/orchestrator.ts` | `src/lib/research/orchestrator.ts` | **Rename Both** | Lógica de negocio diferente. Renombrar con prefijo de dominio. |
| **snapshot-service.ts** | `src/lib/research/snapshot-service.ts` | `src/lib/services/snapshot-service.ts` | **Rename Both** | Colisión entre Historico de Research y Métricas Financieras. |

## 2. Acciones Específicas

### Módulo: Research
- `src/lib/research/snapshot-service.ts` -> `src/lib/research/research-snapshot-service.ts`
- `src/lib/research/orchestrator.ts` -> `src/lib/research/research-orchestrator.ts`
- `src/lib/research/v3-prompts.ts` -> `src/lib/research/research-v3-prompts.ts`

### Módulo: Creative / Copy
- `src/lib/creative/orchestrator.ts` -> `src/lib/creative/creative-orchestrator.ts`
- `src/lib/copy/v3-prompts.ts` -> `src/lib/copy/copy-v3-prompts.ts`

### Módulo: General / AI
- `src/lib/gemini.ts` -> `src/lib/gemini-adapter.ts`
- `src/lib/services/snapshot-service.ts` -> `src/lib/services/metrics-snapshot-service.ts`

### Módulo: Marketing (Cleanup)
- `src/lib/meta-ads.ts` -> **ELIMINADO** (Ya reemplazado por `src/lib/marketing/meta-ads.ts`).

---
## 3. Reglas de Next.js (No tocar)
Los archivos `page.tsx`, `route.ts`, `actions.ts` y `layout.tsx` **no se tocarán** ya que su duplicidad es requerida por la arquitectura de App Router.
