# Reporte de Duplicados: Rutas y Componentes

Este informe documenta los componentes y módulos de enrutado hallados en estado de redundancia o posible colisión por crecimiento orgánico.

## 1. Módulos de Rutas Duplicados (Spanglish y Evolución)

A lo largo del código de `src/app`, hemos detectado varias carpetas semánticamente equivalentes. Esto suele ocurrir cuando un módulo crece en español y luego se migra a un término en inglés (o viceversa) sin borrar los archivos previos.

1. **`pedidos` vs `logistics/orders`**
   - **Contexto:** Se detectaron ambas carpetas con un `page.tsx` activo. El archivo de navegación `nav.ts` envía al usuario a `/pedidos`, dejando a la ruta dentro de logística potencialmente en el olvido, aunque conceptualmente pertenezcan a lo mismo.

2. **`contabilidad` vs `finances/*`**
   - **Contexto:** `/contabilidad` es una página "legacy", mientras que todo el ecosistema económico parece haber mutado y florecido en la subcarpeta jerárquica `/finances/` (albergando hoy día *accounting*, *ledger*, *profits*, *products*).

3. **`dashboard/productos/` vs `productos/`**
   - **Contexto:** Resulta evidente que la plataforma introdujo el patrón Top-Level `/dashboard/...` y anidó todo allí con un `layout.tsx` superior para inyectar menús contextuales a los productos, pero la semilla original `/productos` no ha sido eliminada.

4. **`centro-creativo` vs `marketing/creative-library`**
   - **Contexto:** El "Creative Lab" fue ascendido jerárquicamente. Originalmente anclado a marketing genérico («`creative-library`»), hoy su URL principal promovida en el NAV global es `/centro-creativo`.

5. **`analiticas` vs `analytics/master` vs `rendimiento`**
   - **Contexto:** El NavBar dirige el Dashboard de Profit hacia `/rendimiento`, pero el árbol de proyecto incluye carpetas dedicadas para *Analytics* puras. Probablemente pantallas prototipo iteradas durante el desarrollo de la métrica financiera actual.

---

## 2. Inventario de Componentes UI Duplicados o Fraccionados

Las auditorías en `src/components/ui/` no revelan "clones" perjudiciales exactos (mismo código repetido ciegamente), sino **variaciones fraccionadas de diseño**.

### Patrón Tablas
- `table.tsx` (Componente visual base originario de Radix/Shadcn)
- `data-table.tsx` (Alta probabilidad de ser un Wrapper lógico - DataGrid con paginado)
- `table-alert.tsx` (Variante inyectada con métricas de urgencia/semáforos)
*Se recomienda consolidar este último bajo un prop genérico de Variant dentro de table abstracto para evitar fragmentaciones.*

### Patrón Indicadores de Estado
- `badge.tsx` (Original de librerías UI)
- `badge-status.tsx` (Envoltorio con inyección de lógica semántica, e.g. "Color rojo si enum es FAILED"). Extremo similar, una abstracción que no duele conservar pero de ser posible es mejor centralizada.

**Conclusión Operativa:** Los componentes UI no revisten de un riesgo crítico de arquitectura para la escalabilidad, por lo tanto, no se recomienda una reconstrucción urgente, sino un mero refactor pasivo con el correr de mejoras secundarias.
