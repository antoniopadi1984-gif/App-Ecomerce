# Mapa Real de Modelos y Fuentes de Verdad

## Workspaces / Multi-tenant
- **¿Existe Workspace?**: Sí, el modelo es `Store`.
- **¿Existe storeId en tablas core?**:
    - `Order`: Sí (`storeId`)
    - `LedgerEntry`: Sí (`storeId`)
    - `Job`: No (es global a nivel de tabla, pero el payload puede contener contexto).
    - `CreativeAsset`: Sí (`storeId` opcional).
    - `Product`: Sí (`storeId`).
- **Jerarquía**: `User` <-> `UserStoreAccess` <-> `Store`. Un usuario puede acceder a múltiples tiendas.

## Jobs / Queue
- **Modelo**: `Job`.
- **Estados**: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`.
- **Persistencia**: Tabla `Job` en SQLite.
- **Worker**: `src/lib/worker.ts`. Se ejecuta como un bucle `while(true)` secuencial dentro del proceso de Next.js (via `instrumentation.ts`).

## Credenciales
- **Modelo**: `Connection`.
- **Campos**: `apiKey`, `apiSecret`, `accessToken`, `extraConfig`.
- **Estado**: Almacenados en texto plano (Prisma standard).

## Profit (Fuente de Verdad)
- **Tablas Reales**: 
    - `Order`: Contiene `totalPrice`, `totalTax`, `shippingCost`, `estimatedProfit`, `realProfit`, `netProfit`.
    - `DailyFinance`: Snapshot diario de métricas.
    - `LedgerEntry`: Entradas contables individuales (ingresos/gastos).
- **Fuente actual**: El dashboard de Finanzas (`/finances`) parece consolidar datos de `Order` y `DailyFinance`.
