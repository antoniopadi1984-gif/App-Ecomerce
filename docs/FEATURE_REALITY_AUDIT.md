# Feature Reality Audit

Este documento audita el estado actual de las 10 rutas prioritarias para eliminar "features falsas" (mocked data o hardcoded UI) y asegurar que todas funcionen con datos reales, acciones reales, y manejen los 4 estados de UI (Cargando, Error, Vacío, No Configurado).

## Rutas Prioritarias (Top 10)

| Prioridad | Ruta | Estado Actual (UI) | Qué debería hacer (Data + Acciones) | Fuente de Verdad | Estado | Bloqueo Actual / Tareas Pendientes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `/pedidos` | UI Real (OrdersHubClient) con pestañas y filtros. | Fetch real de pedidos + acciones reales en Shopify/Beeping. | Prisma (DB) / Shopify API | ⚠️ PARCIAL | El endpoint `/api/orders` funciona. Falta asegurar que no muestra UI si Shopify no está conectado y confirmar mutaciones. |
| 2 | `/logistica` | Matrix operativa, cards reales, simulación de AI. | Cargar matriz real (`getDailyOperationsMatrix`), IA real, update costs. | Prisma / Beeping | ⚠️ PARCIAL | `getDailyOperationsMatrix` lee DB pero Beeping Sync puede estar fallando o mockeado. |
| 3 | `/customers` | Unknown actual, needs audit. | Lista real de clientes de Shopify y compras previas. | Prisma / Shopify CRM | ❌ NO FUNCIONA | Falta revisar `/customers` source pero usualmente está mockeado. |
| 4 | `/finances` | Unknown actual, needs audit. | KPIs reales, tabla de contabilidad mensual, rules. | Prisma / Meta Ads | ❌ NO FUNCIONA | Revisar integraciones Meta/Prisma para Finanzas completas. |
| 5 | `/dashboard/productos` | Lista de productos y tarjetas de inventario. | Fetch real de tienda, acciones de DB (Product). | Prisma (Product / Store) | ⚠️ PARCIAL | Lee datos reales del Contexto (Prisma), pero faltan acciones de CRUD completas en la UI. |
| 6 | `/rendimiento` | Datos mock en timeout (`loadKPIs` fake en producto). Global usa `getAdvancedKPIs`. | Métricas consolidadas por producto (ROAS, CPA, CVR) reales. | Analytics API / Meta / Prisma | ⚠️ PARCIAL | Eliminar `setTimeout` y hacer fetch real para vista de Producto. Vista Global ya es medio real. |
| 7 | `/centro-creativo` | UI completa, layouts nuevos. | Generación asíncrona real con Replicate, guardar asset en DB. | Replicate API / DB (`useCreative`) | ⚠️ PARCIAL | El hook `useCreative` todavía devuelve mucha info estática y de simulación. |
| 8 | `/marketing/facebook-ads` | Tabla de campañas que lee de `/api/marketing/performance`. | Fetch real Meta Ads API, insights de IA dinámica. | Meta API / Prisma | ⚠️ PARCIAL | AI Panel tiene texto hardcoded. Necesita conexión real con insights generados por IA. |
| 9 | `/marketing/ad-spy` | Unknown actual, needs audit. | Buscar en Ad Library real o base de datos scrapeada. | Meta Ad Library API? | ❌ NO FUNCIONA | Posiblemente todo mock. Requiere endpoint de scraping/API. |
| 10 | `/team` | Unknown actual, needs audit. | Gestión real de roles, invitaciones y perfiles AI. | Prisma (User/Team) | ❌ NO FUNCIONA | Asegurar que crear usuarios o AI agents afecte la DB. |
