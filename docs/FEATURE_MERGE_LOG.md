# MERGE LOG: Route Consolidation (Paso B)

## Registro de Operaciones

### 1. Productos
- **Operación**: Migración Completa de `src/app/productos/page.tsx` a `src/app/dashboard/productos/page.tsx`.
- **Archivos Modificados**: `src/app/dashboard/productos/page.tsx` (Sobrescrito por completo con lógica canónica).
- **Archivos Eliminados**: La carpeta de la ruta original `src/app/productos` fue borrada permanentemente tras verificar el `build`. Adicionalmente, se solventaron dependencias rotas subyacentes en el proyecto (p. ej. uso de `<Suspense>` en Avatares y handler params en verificación).

### 2. Rendimiento
- **Operación**: Consolidación de `analytics/master` y `analiticas` en `rendimiento` con soporte dual nativo.
- **Archivos Modificados**: `src/app/rendimiento/page.tsx` (Merge de ambas KPIs en vista condicional por `productId`).
- **Archivos Eliminados**: Se eliminaron recursivamente `src/app/analytics/master` y `src/app/analiticas`.

### 3. Finanzas
- **Operación**: Consolidación de `contabilidad` en `finances` con soporte por `productId`.
- **Archivos Modificados**: `src/app/finances/page.tsx` (Se integró `ProductFinancialsDashboard` condicionalmente al seleccionar un producto).
- **Archivos Eliminados**: La ruta legacy `src/app/contabilidad` fue eliminada al integrar al 100% sus features en la sección individual de finanzas.

### 4. Pedidos
- **Operación**: Eliminación de redirección redundante y preservación de lógica de acciones.
- **Archivos Modificados**: Múltiples importaciones a lo largo del sistema (p. ej., `src/lib/handlers/logistics-sync.ts`, `src/components/logistics/OrdersHubClient.tsx`, etc.) para apuntar al nuevo path de las acciones.
- **Archivos Movidos**: `src/app/logistics/orders/actions.ts` se movió a `src/app/pedidos/actions.ts` dado que contenía controladores esenciales que no estaban duplicados en otro lado.
- **Archivos Eliminados**: Se eliminó `src/app/logistics/orders/page.tsx` pues solo efectuaba de redirección hacia `/pedidos`.

### 5. Creativos
- **Operación**: Eliminación de `creative-library` por ser una redirección al dashboard (y estando las funcionalidades ya contenidas en `centro-creativo`).
- **Archivos Modificados**: N/A (Migrating/Redirect elimination only).
- **Archivos Eliminados**: `src/app/marketing/creative-library`.
