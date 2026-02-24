# Mapa Real de Rutas (Next.js App Router)

| Ruta | Tipo | Archivo | Protegida | Notas |
| :--- | :--- | :--- | :--- | :--- |
| `/` | Page | `src/app/page.tsx` | No | Dashboard principal / Landing |
| `/finances` | Page | `src/app/finances/page.tsx` | Contexto | Requiere `storeId` via context/query |
| `/pedidos` | Page | `src/app/pedidos/page.tsx` | Contexto | Requiere `productId` via context |
| `/logistica/...` | Page | `src/app/logistica/page.tsx` | No | Gestión de envíos |
| `/marketing/...` | Page | `src/app/marketing/page.tsx` | No | Múltiples sub-módulos (MVPs, Ads, Copy) |
| `/research/...` | Page | `src/app/research/page.tsx` | Contexto | Requiere contexto de producto |
| `/api/auth/google` | API | `src/app/api/auth/google/route.ts` | No | Iniciador de OAuth (Integraciones) |
| `/api/finances/...` | API | `src/app/api/finances/route.ts` | Parcial | Algunos validan `storeId` opcional |
| `/api/marketing/...` | API | `src/app/api/marketing/route.ts` | No | Mayoría usa `default-store` mock |
| `/api/webhooks/...` | API | `src/app/api/webhooks/route.ts` | No | Listeners de Shopify/Beeping |

**Notas sobre "Protegida":**
- No se ha detectado middleware de autenticación global (`middleware.ts`).
- La "protección" actual es funcional: componentes que fallan amigablemente si no hay un `activeStoreId` o `productId` en el `localStorage`/Contexto.
- Existen rutas de `/api/auth/google` pero parecen destinadas a tokens de servicio/integración más que a login de usuario.
