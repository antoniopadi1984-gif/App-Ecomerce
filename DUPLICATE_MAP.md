# 🗺️ MAPA DE DUPLICADOS Y PLAN DE CONSOLIDACIÓN

## 1. Análisis de Rutas Duplicadas

Tras la auditoría de `CURRENT_ROUTES.txt`, se han identificado las siguientes duplicidades que deben ser consolidadas en el ecosistema V4 (bajo `/dashboard/productos/[productId]/`):

| Funcionalidad | Ruta Principal (V4) | Ruta Duplicada / Legacy | Acción Propuesta |
| :--- | :--- | :--- | :--- |
| **Investigación** | `app/dashboard/productos/[id]/research` | `app/marketing/product-brain` | Migrar lógica de Brain a Research V4 y eliminar legacy. |
| **Creativos** | `app/dashboard/productos/[id]/creative` | `app/marketing/creative-library` | Unificar en Fábrica Creativa. Eliminar library antigua. |
| **Analíticas** | `app/dashboard/productos/[id]/analytics` | `app/analytics/master` | `master` para vista global, V4 para vista de producto. |
| **Pedidos** | `app/dashboard/productos/[id]/orders` | `app/logistics/orders` | Unificar componentes de tabla en `ProductOrdersDashboard`. |
| **Finanzas** | `app/dashboard/productos/[id]/financials` | `app/finances/page.tsx` | Mover dashboards específicos a componentes de Finanzas V4. |
| **Lanzamiento** | `app/marketing/mvp-wizard` | N/A | **MANTENER** (con badge NUEVO) como herramienta de sistema. |

## 2. Plan de Acción Inmediato (Paso a Paso)

### Paso 1: Infraestructura de Marca y Traducción
- Crear `/lib/constants/translations.ts` con todos los términos en español (Analíticas, Pedidos, etc.).
- Crear `/lib/styles/design-system.ts` para fijar el espaciado (gap-4, padding-6) y sombras.
- Implementar `/components/ui/premium-card.tsx` para reemplazar las cards estándar con exceso de padding.

### Paso 2: Consolidación de Navegación
- Refactorizar `/components/layout/sidebar.tsx` usando el objeto `NAVIGATION` unificado para evitar duplicados en el menú.
- Asegurar que al seleccionar un producto, las opciones globales redundantes se oculten.

### Paso 3: Limpieza y Estandarización
- Eliminar las carpetas `marketing/product-brain` y `marketing/creative-library` tras verificar la migración.
- Aplicar el helper `t()` en todas las etiquetas de la interfaz para consistencia.

---
> [!IMPORTANT]
> **No se crearán rutas nuevas**. Todo el trabajo se centrará en mejorar y limpiar lo que ya existe listed en `CURRENT_ROUTES.txt`.
