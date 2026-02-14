# FASE 0 — INVENTARIO TÉCNICO DE ECOMBOM CONTROL

> Documento generado: 2026-02-14. Fuente: análisis automático del repositorio.

---

## 1. Cómo Arrancar

### `npm run dev` (solo Next.js)
Levanta únicamente el servidor Next.js en `localhost:3000`.
- ✅ Frontend + API routes + Server Actions
- ❌ No levanta Worker Sidecar ni Engine Python

### `npm run dev:all` (todo el stack)
Ejecuta en paralelo (via `concurrently`):
1. **Next.js** → `next dev` → `localhost:3000`
2. **Worker Sidecar** → `npx tsx worker-sidecar.ts` → procesa jobs en background
3. **Engine Python** → `bash src/engine/start_engine.sh` → FastAPI en `localhost:8000`

### Arranque manual del Engine
```bash
cd src/engine
bash start_engine.sh  # usa python3, uvicorn en puerto 8000
```

---

## 2. Infraestructura

| Componente | Tecnología | Puerto | Requerido |
|---|---|---|---|
| Frontend + API | Next.js 16.1.4 (React 19) | 3000 | ✅ Siempre |
| Base de Datos | SQLite via Prisma | — | ✅ Siempre |
| Worker Sidecar | Node.js (tsx) | — | ⚠️ Para sync automático |
| Engine Python | FastAPI + Uvicorn | 8000 | ⚠️ Para vídeo/IA |
| FFmpeg | CLI local | — | ⚠️ Solo vídeo |

### Base de Datos
- **Ruta**: `prisma/dev.db` (SQLite)
- **ORM**: Prisma (schema en `prisma/schema.prisma`)
- **Modelos**: 75+ (validado)
- **Migraciones**: `npx prisma migrate dev`
- **Studio**: `npx prisma studio` → `localhost:5555`

---

## 3. Variables de Entorno Reales (52 vars encontradas)

### `.env` (credenciales principales)

| Variable | Usado en | Requerido | Si falta |
|---|---|---|---|
| `DATABASE_URL` | Prisma global | ✅ Crítico | No arranca nada |
| `SHOPIFY_ACCESS_TOKEN` | `src/lib/shopify.ts` | ✅ Para sync | "Shopify auth failed" |
| `SHOPIFY_SHOP_DOMAIN` | `src/lib/shopify.ts` | ✅ Para sync | URLs rotas de API |
| `META_ACCESS_TOKEN` | `src/lib/marketing/meta-ads.ts` | ⚠️ Para ads | "Token inválido" / datos 0 |
| `META_APP_ID` | Meta OAuth | ⚠️ Para ads | No conecta |
| `META_APP_SECRET` | Meta OAuth | ⚠️ Para ads | No conecta |
| `BEEPING_API_KEY` | `src/lib/beeping.ts` | ⚠️ Logística | Sin estados de envío |
| `BEEPING_API_URL` | `src/lib/beeping.ts` | ⚠️ Logística | URL por defecto falla |
| `GEMINI_API_KEY` | `src/lib/ai.ts`, engine | ⚠️ Para IA | Vision/chat no funciona |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Drive, Sheets, Gmail | ⚠️ Para archivos | Drive ops fallan |
| `GOOGLE_OAUTH_CLIENT_ID` | Auth Google | ⚠️ Para OAuth | Botón Google roto |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Auth Google | ⚠️ Para OAuth | Callback falla |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Geocodificación | ⚠️ Para mapas | Geocoding falla |
| `NEXT_PUBLIC_APP_URL` | URLs internas | ⚠️ | default localhost |

### `.env.local` (servicios opcionales)

| Variable | Usado en | Requerido | Si falta |
|---|---|---|---|
| `REPLICATE_API_TOKEN` | `src/lib/ai/providers/replicate.ts` | ❌ Opcional | Avatares/Lip-sync no funciona |
| `ELEVENLABS_API_KEY` | `src/lib/elevenlabs.ts` | ❌ Opcional | TTS no funciona |
| `ANTHROPIC_API_KEY` | Copy Hub | ❌ Opcional | Claude no responde |
| `VERTEX_AI_API_KEY` | Vertex Search | ❌ Opcional | Search disabled |
| `GCS_BUCKET_NAME` | Cloud Storage | ❌ Opcional | Storage remoto falla |
| `BRAVE_API_KEY` | Research | ❌ Opcional | Búsqueda web falla |
| `EXA_API_KEY` | Research | ❌ Opcional | Research parcial |
| `TAVILY_API_KEY` | Research | ❌ Opcional | Research parcial |

### Feature Flags (`.env.local`)

| Flag | Valor actual | Efecto |
|---|---|---|
| `USE_ELEVENLABS` | `true` | Usa ElevenLabs para TTS |
| `USE_GOOGLE_TTS` | `false` | Alternativa TTS |
| `USE_VERTEX_SEARCH` | `false` | Vertex AI Search desactivado |
| `NODE_ENV` | `development` | Modo desarrollo |

---

## 4. Comandos de Verificación

```bash
# Arrancar todo
npm run dev:all

# Solo frontend
npm run dev

# Base de datos
npx prisma migrate dev    # aplicar migraciones
npx prisma studio         # explorar datos
npx prisma db seed        # ejecutar seed (tras crear seed.ts)

# Engine Python
cd src/engine && bash start_engine.sh
curl http://localhost:8000/health

# Health check general
curl http://localhost:3000/api/system/health

# Verificar Shopify
curl http://localhost:3000/api/system/full-sync

# Worker status (verificar jobs)
curl http://localhost:3000/api/jobs
```

---

## 5. Riesgos Documentados

| Riesgo | Severidad | Detalle |
|---|---|---|
| **GEMINI_API_KEY = Google Maps key** | 🔴 Alta | En `.env`, `GEMINI_API_KEY` tiene el mismo valor que `GOOGLE_MAPS_API_KEY`. Probablemente incorrecto — debería ser una API key distinta para Generative Language |
| **Credenciales en texto plano** | 🔴 Alta | `.env` tiene Service Account JSON completo, tokens de Shopify/Meta sin cifrar |
| **SQLite en producción** | 🟡 Media | Funciona para desarrollo/single-user, pero no escala para multi-tenant SaaS |
| **Sin seed** | 🟡 Media | No hay forma automatizada de crear datos de prueba consistentes |
| **Worker crashea silencioso** | 🟡 Media | Si el worker muere, no hay restart automático ni alerta |
| **`ENCRYPTION_KEY` no definida** | 🟡 Media | Referenciada en código pero no existe en ningún `.env` |
