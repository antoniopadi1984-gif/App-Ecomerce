# Matriz de Funcionalidades (Paso B)

## 1. Logistics: `src/app/logistics/orders` -> `src/app/pedidos`
- **Diagnóstico:** `src/app/logistics/orders/page.tsx` es únicamente un redireccionamiento hacia `/pedidos` (`router.push("/pedidos")`).
- **Ruta Canónica (`/pedidos`):** Implementa todo el `OrdersHubClient`.
- **Acción:** Eliminar la carpeta `src/app/logistics/orders`. La funcionalidad ya está 100% en `/pedidos`.

## 2. Productos: `src/app/productos` -> `src/app/dashboard/productos`
- **Diagnóstico:** Actualmente, `src/app/dashboard/productos/page.tsx` redirige a `/productos`. Sin embargo, el objetivo es que la ruta canónica sea `/dashboard/productos`. El código real, con las métricas y la grilla de productos, vive en `src/app/productos/page.tsx`.
- **Acción:** Mover todo el contenido de `src/app/productos/page.tsx` hacia `src/app/dashboard/productos/page.tsx`. Luego, eliminar `src/app/productos`.

## 3. Creativos: `src/app/marketing/creative-library` -> `src/app/centro-creativo`
- **Diagnóstico:** `src/app/marketing/creative-library/page.tsx` sólo redirige hacia productos y no contiene lógica real. `src/app/centro-creativo/page.tsx` ("Factoría Creativa") tiene el layout unificado completo y usa todos los módulos (`BrandingModule`, `VideoLabModule`, etc.).
- **Acción:** Validado que `/centro-creativo` es la ruta canónica. Eliminar la carpeta inactiva/redundante `src/app/marketing/creative-library`.

## 4. Finanzas: `src/app/contabilidad` -> `src/app/finances`
- **Diagnóstico:** `/contabilidad` carga el componente `ProductFinancialsDashboard` dependiente de `productId`. Dicho componente no se vuelve a usar en el proyecto. Por otro lado, `/finances/page.tsx` (Profit & Ledger V4) ya gestiona el contexto global o de un producto (`productId === 'GLOBAL' ? ...`) y posee una interfaz más avanzada (Neural Insights, transacciones diarias).
- **Acción:** Redirigir o eliminar `/contabilidad` y retirar el componente huérfano `ProductFinancialsDashboard.tsx`. La ruta canónica `/finances` y `/finances/products` asumen sus funciones.

## 5. Analíticas: `src/app/analytics/master` + `src/app/analiticas` -> `src/app/rendimiento`
- **Diagnóstico:** 
  - `analytics/master/page.tsx` contiene un Dashboard avanzado ("KPI COMMAND HUB") conectado a datos backend (`getAdvancedKPIs`). 
  - `analiticas/page.tsx` es una vista dependiente de un producto (con datos hardcoded a modo mock) llamada "ProductAnalyticsPage".
  - `/rendimiento/page.tsx` es un placeholder con métricas hardcoded ("Rendimiento Operativo") y dice "Gráficos en Construcción".
- **Acción:** 
  Consolidar el código valioso de `analytics/master` (KPIs avanzados y layout) y la lógica condicional por producto de `analiticas` en `src/app/rendimiento/page.tsx`. Luego, eliminar de manera segura las carpetas `analytics/master` y `analiticas`.
