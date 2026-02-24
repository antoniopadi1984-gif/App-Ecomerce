# FEATURE DIFF: Route Consolidation (Paso B)

## 1. Productos (`src/app/productos` -> `src/app/dashboard/productos`)
### Features a migrar:
- [x] Renderizado de la lista de productos real (`allProducts` del contexto).
- [x] Barra de búsqueda y filtrado de productos.
- [x] Tarjetas de resumen "ACTIVOS" y "TOTAL".
- [x] Renderizado de la tarjeta individual de producto con estados, nombre, imagen y badge de versión.
- [x] Acción de selección de producto (`handleSelectProduct` -> redirige a `/research`).
- [x] Estado de carga ("Skeletons").
- [x] Empty state interactivo.

### Estado Final:
- **VERIFICADO (Legacy folder pendiente de borrado final)**

## 2. Rendimiento (`src/app/analytics/master` + `src/app/analiticas` -> `src/app/rendimiento`)
### Features a migrar:
- [x] Soporte Dual (Vista Global vs Vista por Producto).
- [x] Selector de periodo (DAY, WEEK, MONTH).
- [x] Tarjetas KPI avanzados (Tráfico, Financiero, Logística).
- [x] Tablas de Desglose (Top Items, Logistics Flow, Bots).
- [x] Botón de actualización / Skeletons de carga.

### Estado Final:
- **VERIFICADO (Legacy folders pendientes de borrado final)**

## 3. Finanzas (`src/app/contabilidad` -> `src/app/finances`)
### Features a migrar:
- [x] Renderizado de `ProductFinancialsDashboard` (¿Contiene algo que no esté en `Profit & Ledger V4`?).
- [x] Tabs y estructura general.

### Estado Final:
- **VERIFICADO (Legacy folder pendiente de borrado final)**

## 4. Pedidos (`src/app/logistics/orders` -> `src/app/pedidos`)
### Features a migrar:
- [x] Redirección hacia la ruta canónica `/pedidos`. (No hay lógica que migrar, la canónica ya porta todo a través de `OrdersHubClient`).

### Estado Final:
- **VERIFICADO (Legacy folder pendiente de borrado final)**

## 5. Creativos (`src/app/marketing/creative-library` -> `src/app/centro-creativo`)
### Features a migrar:
- [x] Redirección redundante hacia el dashboard principal. (Se elimina, pues la canónica `centro-creativo` agrupa todas las features reales de la librería).

### Estado Final:
- **VERIFICADO (Legacy folder pendiente de borrado final)**
