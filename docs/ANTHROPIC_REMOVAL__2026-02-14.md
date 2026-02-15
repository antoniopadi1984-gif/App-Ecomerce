# Anthropic Removal — Inventario y Log

**Fecha:** 2026-02-14  
**Estado:** ✅ COMPLETADO

## Archivos modificados

| Archivo | Cambio | Líneas |
|---|---|---|
| `src/lib/agents/agent-dispatcher.ts` | `dispatchToClaude()` → `dispatchToReplicate()` via ReplicateProvider | -60 +40 |
| `src/lib/agents/agent-registry.ts` | 7 agentes `'claude'` → `'replicate-claude'`, `model: REPLICATE_MODELS.TEXT.CLAUDE_DEFAULT` | ~20 |
| `src/lib/config/api-config.ts` | Eliminado bloque `anthropic: { apiKey, endpoint, model, version }` | -14 |
| `src/lib/health.ts` | `checkAnthropicHealth()` → `checkReplicateHealth()` | -10 +10 |
| `src/lib/ai.ts` | Eliminada `askClaude()` (dead code, nunca importada) | -26 |

## Archivos nuevos

| Archivo | Propósito |
|---|---|
| `src/lib/ai/gateway.ts` | AI Gateway unificado: runText, runImage, runVideo, classifyTask |
| `src/lib/ai/replicate-models.ts` | Mapa centralizado de modelos Replicate (Claude, Flux, Luma, etc.) |

## Refs residuales (intencionales)

- `src/lib/security/safe-ui.ts` — `ANTHROPIC_API_KEY` en blocklist anti-regresión
- `src/lib/ai/model-registry.ts` — `anthropic/claude-3.7-sonnet` como ID de modelo Replicate (correcto)
- `src/lib/ai/providers/replicate.ts` — `anthropic/claude-*` en getModels() (IDs Replicate)
- UI links a `claude.ai` en `ai-bridge/page.tsx` y `ai-collaboration-panel.tsx` (shortcuts externos, sin API)

## ENV eliminadas

- `ANTHROPIC_API_KEY` — ya no se lee en ningún archivo
- `CLAUDE_MODEL` — ya no se usa (modelo hardcoded como `anthropic/claude-3.7-sonnet`)
