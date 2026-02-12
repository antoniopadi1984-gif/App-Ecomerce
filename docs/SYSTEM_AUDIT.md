# AUDITORÍA DEL SISTEMA - 9 DE FEBRERO 2025

## 1. ESTRUCTURA DE DIRECTORIOS

### Módulos en /lib (Clasificación AI/API)
- **AI Infrastructure**:
  - `src/lib/ai/router.ts`: Módulo central de despacho de IA [REVISAR/OPTIMIZAR].
  - `src/lib/ai/model-registry.ts`: Registro de modelos y mapeo de tareas [OK].
  - `src/lib/ai/providers/gemini.ts`: Proveedor de Vertex AI Bridge [OK].
  - `src/lib/ai.ts`: **REDUNDANTE/LEGACY**. Usa `askGemini` con modelos inexistentes (3.5).
  - `src/lib/gemini.ts`: **REDUNDANTE/LEGACY**. Usa modelos inexistentes (2.5).
- **Core Business Logic**:
  - `src/lib/research/`: Orquestadores de investigación v2 y v3.
  - `src/lib/video/`: Procesamiento y clasificación de video.
  - `src/lib/creative/`: Generación de anuncios y landing pages.
- **External Integrations**:
  - `src/lib/shopify.ts`: API Admin de Shopify.
  - `src/lib/meta-ads.ts`: API Graph de Meta.
  - `src/lib/elevenlabs.ts`: Síntesis de voz.
  - `src/lib/google-drive.ts`: Gestión de archivos en la nube.
  - `src/lib/beeping.ts` / `src/lib/dropea.ts` / `src/lib/dropi.ts`: Logística.

## 2. INTEGRACIONES ENCONTRADAS

### Vertex AI (Gemini)
- **Ubicación**: `src/lib/ai/providers/gemini.ts` y `src/lib/ai/router.ts`.
- **Modelo actual**: `gemini-1.5-pro` y `gemini-1.5-flash`.
- **Versión estable recomendada**: `gemini-1.5-pro-002` / `gemini-1.5-flash-002`.
- **Estado**: **OK** (Recién corregido, pero necesita centralización en `API_CONFIG`).

### ElevenLabs
- **Ubicación**: `src/lib/elevenlabs.ts`.
- **Estado**: **IMPLEMENTADO**. Usa `eleven_multilingual_v2`.

### Replicate
- **Ubicación**: `src/lib/ai/providers/replicate.ts`.
- **Estado**: **IMPLEMENTADO** para generación de imágenes y avatares.

### Meta Ads / Shopify
- **Ubicación**: `src/lib/meta-ads.ts`, `src/lib/shopify.ts`.
- **Versiones**: Meta Graph v18.0, Shopify API 2024-01.

## 3. VARIABLES DE ENTORNO

### Existentes (.env.local):
- `GOOGLE_CLOUD_PROJECT_ID`
- `VERTEX_AI_API_KEY`
- `GOOGLE_CLOUD_LOCATION`
- `REPLICATE_API_TOKEN`
- `ELEVENLABS_API_KEY`
- `GCS_BUCKET_NAME`

### Faltantes:
- `VERTEX_SEARCH_DATA_STORE_ID` / `ENGINE_ID` (Vacíos).
- `GEMINI_MODEL_PRODUCTION` (Se recomienda centralizar).
- `USE_ELEVENLABS` / `USE_GOOGLE_TTS` (Flags de configuración).

## 4. DEPENDENCIAS

### Instaladas (package.json):
- `@ai-sdk/google`: ^3.0.22
- `@google/generative-ai`: ^0.24.1
- `google-auth-library`: ^10.5.0
- `replicate`: ^1.4.0
- `googleapis`: ^170.1.0

### Obsoletas/Redundantes:
- `@google/generative-ai`: Se puede consolidar todo vía Vertex REST Bridge o AI SDK.
- `dotenv`: No es necesario en Next.js moderno (lo maneja nativamente).

## 5. PROBLEMAS ENCONTRADOS

1. **Redundancia de Código**: Los archivos `src/lib/ai.ts` y `src/lib/gemini.ts` fuera del directorio `src/lib/ai/` contienen lógica vieja y modelos que ya no existen, causando confusión y posibles errores 404 si se importan accidentalmente.
2. **Hardcoding de Modelos**: Muchos módulos tienen los nombres de los modelos escritos directamente en el código del servidor en lugar de usar una configuración central.
3. **Múltiples Clientes HTTP**: Se usa `fetch` directo para algunas APIs y librerías cliente para otras, sin un estándar de manejo de errores.
4. **Variables Huérfanas**: `GEMINI_API_KEY` se usa indistintamente con `VERTEX_AI_API_KEY`.

## 6. PLAN DE ACCIÓN RECOMENDADO

1. **Centralización**: Crear `src/lib/config/api-config.ts` para unificar todos los endpoints y modelos.
2. **Limpieza**: Eliminar `src/lib/ai.ts` y `src/lib/gemini.ts` una vez verificado que nada crítico depende de ellos.
3. **Migración**: Actualizar `AiRouter` para usar exclusivamente `API_CONFIG`.
4. **Validación**: Implementar el endpoint `/api/health` para verificar la conectividad de todas las llaves en tiempo real.
5. **Estandarización**: Asegurar que todos los modelos de IA usen las versiones `-002` (estables de Febrero 2025).
