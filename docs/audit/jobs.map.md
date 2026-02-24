# Verificación de Cola de Jobs

## Sistema de Worker
- **Archivo**: `src/lib/worker.ts`
- **Lanzamiento**: Automatizado via `src/instrumentation.ts` al arrancar Next.js.
- **Persistencia**: Tabla `Job` en `prisma/schema.prisma`. Locks gestionados via campo `lockedAt`.

## Tipos de Jobs Implementados
- `SHOPIFY_SYNC`: Sincronización recurrente de pedidos (cada 2 min).
- `LOGISTICS_SYNC`: Polling inteligente (5/10/60 min según segmento).
- `AI_EXTRACT`: Procesamiento de datos con LLM.
- `GENERATE_AVATAR_IMAGE`: Generación de assets de marketing.
- `MAINTENANCE`: Limpieza y optimización.

## Flujo de Ejecución
1. El worker busca el primer job `PENDING` ordenado por fecha.
2. Actualiza estado a `PROCESSING` y pone timestamp en `lockedAt`.
3. Ejecuta el handler correspondiente (`src/lib/handlers/...`).
4. Si falla, marca como `FAILED` y registra `lastError`.
5. Si tiene éxito, marca como `COMPLETED` con el resultado JSON.

## Observaciones
- **Secuencialidad**: Al ser un bucle único en el proceso Node, los jobs se ejecutan uno a uno.
- **Locks**: No hay sistema de timeout para locks colgados (si un proceso muere en medio, el job queda en `PROCESSING` indefinidamente hasta intervención manual).
- **Logging**: Los logs principales van a la consola de la aplicación/standard output.
