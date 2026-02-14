# Dependencias y Salud del Sistema - Ecombom Control

## Infraestructura Necesaria

- **Next.js Server**: v16.1.4 (React 19).
- **Worker Sidecar**: Proceso Node.js independiente (`worker-sidecar.ts`).
- **Engine Python**: FastAPI en puerto 8000. Requiere Python 3.10+, FFmpeg y torch.
- **Base de Datos**: SQLite (Prisma). Ubicación: `prisma/dev.db`.

## Dependencias de APIs Externas

| Módulo | Proveedor | Credencial | Estado Requerido |
| --- | --- | --- | --- |
| Shopify | Shopify | `SHOPIFY_ACCESS_TOKEN` | Read/Write Orders, Products |
| Meta Ads | Meta | `META_ACCESS_TOKEN` | Ads Management, Ads Insights |
| Logística | Beeping | `BEEPING_API_KEY` | Basic Auth |
| IA Vision | Google Gemini | `GEMINI_API_KEY` | Generative Language API |
| Voz IA | ElevenLabs | `ELEVENLABS_API_KEY` | v1 Rendering |

## Endpoints Clave (Auditoría)

- `GET /api/system/health`: (A implementar) Salud unificada.
- `POST /api/marketing/sync`: Sincronización de Meta.
- `POST /api/finances/accounting/rebuild`: (Fase 2) Reconstrucción de snapshots.
- `GET /api/jobs`: Listado de tareas del worker.
- `POST /api/webhooks/beeping`: Webhook de retorno de logística.
