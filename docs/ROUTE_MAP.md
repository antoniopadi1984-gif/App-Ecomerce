# Route Map & Consolidations

Este documento contiene la propuesta de resolución para rutas duplicadas o solapadas dentro de la plataforma, dictando cuál ruta debe declararse como "Canónica" y cuáles deben prepararse para un futuro redireccionamiento o eliminación.

| Módulo | Ruta Canónica Propuesta | Rutas a Redirigir/Eliminar (ALIASES/DEPRECATE) | Razón |
| :--- | :--- | :--- | :--- |
| **Productos** | `src/app/dashboard/productos/...` | `src/app/productos/...` | `/dashboard/productos` tiene un layout dedicado (`layout.tsx`) y vistas anidadas enriquecidas (ej. `settings`), convirtiéndose en el estándar. |
| **Pedidos** | `src/app/pedidos/...` | `src/app/logistics/orders/...` | `/pedidos` es la ruta oficial enlazada en el sidebar principal (`nav.ts`). |
| **Logística** | `src/app/logistica/...` | `src/app/logistics/settings/...`, `src/app/logistics/costs/...` | `/logistica` también es oficial en `nav.ts`. Conviene consolidar los settings bajo el nombre en español u optar 100% por el inglés. |
| **Finanzas** | `src/app/finances/...` | `src/app/contabilidad/...` | `/finances` ya es una carpeta sumamente rica con múltiples submódulos (`accounting`, `ledger`, `profits`, `rules`), haciendo a `/contabilidad` redundante o un alias legacy. |
| **Analíticas** | `src/app/rendimiento/...` (Desde NAV) | `src/app/analiticas/...`, `src/app/analytics/master/...` | Existe una fragmentación. El NAV apunta a `/rendimiento` para "Profit & ROAS". Se debe consolidar los dashboards maestros bajo una sola nomenclatura. |
| **Creativos** | `src/app/centro-creativo/...` | `src/app/marketing/creative-library/...` | `/centro-creativo` es accesible globalmente desde el NAV, por lo que asume el rol principal fuera de la carpeta marketing genérica. |

---

## 🎯 Plan Paso B: Procedimiento de Consolidación (SIN CAMBIOS AÚN)

Cuando decidamos ejecutar la limpieza, seguiremos este flujo de manera quirúrgica para no romper la app:

1. **Aislamiento de Lógica:** Identificar si la ruta *DEPRECATE* tiene lógica única que deba trasladarse a la ruta *CANONICAL* antes de borrarla.
2. **Redirecciones Hardcoded:** Crear en el archivo `next.config.ts` un bloque de `redirects()`. Por ejemplo: de `/productos` hacia `/dashboard/productos`. Esto permite que URLs oxidadas sigan funcionando.
3. **Soft Delete (`_app`)**: Renombraremos las carpetas a eliminar agregándoles un guion bajo frente a su nombre (ej. `src/app/_productos`). Next.js las ignorará de inmediato en el router (App Router excluye prefijos `_`).
4. **Validación:** Arrancaremos el entorno de desarrollo y validaremos que ningún `Link` o Router interno colapse.
5. **Hard Delete:** Tras 48h de validación, eliminaremos finalmente las carpetas segregadas.
