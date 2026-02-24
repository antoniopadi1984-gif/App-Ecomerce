# Detección de Mocks y Hardcodes

## Lista de Hallazgos Críticos

| Ubicación | Tipo | Riesgo | Sustitución Requerida |
| :--- | :--- | :--- | :--- |
| `src/app/api/marketing/sync/route.ts` | `default-store` | Alto | Obtener `storeId` de la sesión o headers. |
| `src/app/marketing/ads-moderator/page.tsx` | `MOCK_COMMENTS` | Bajo | Fetch real de la tabla `SocialComment` (si existe). |
| `src/app/api/finances/sync-today/route.ts` | `default-store` | Medio | Validar contra la tienda activa del usuario. |
| `src/lib/worker.ts` | `setTimeout` (5s) | N/A | Bucle de espera normal para workers. |
| `src/app/api/webhooks/master-listener/route.ts` | `db create default-store` | Alto | No debería crear tiendas en webhooks, solo asignar a existentes. |
| Múltiples componentes UI | `Math.random` | Bajo | Usado en animaciones o IDs temporales. |

## Plan de Mitigación
1. **Unificación de Contexto**: Mover el `storeId` de `localStorage` a un header consistente en todas las llamadas API.
2. **Eliminar fallback "default-store"**: Forzar error 401/404 si no se provee una tienda válida, en lugar de persistir datos en una tienda fantasma.
3. **Persistencia de Mocks**: Mover datos de marketing (`ads-moderator`) a la base de datos para permitir edición real.
