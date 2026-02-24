
# FASE 2: Auditoría Visual & Plan de Densidad

**Fecha**: 2026-02-15
**Estado**: En Progreso

## 1. Auditoría de Layouts

### 1.1 TopBar (`src/components/layout/top-bar.tsx`)
- **Altura**: `h-14` (56px). Correcto segun nuevo estándar.
- **Problem (Cutoff Text)**: El selector de tienda tiene `max-w-[160px]` y los textos internos usan `truncate`. En pantallas pequeñas o con nombres largos, se corta agresivamente.
- **Estructura**: Flex con `gap-3`. Zona Izquierda (Selectores) + Spacer + Zona Derecha (KPIs/User).
- **Color**: `bg-white`, `border-slate-200`.

### 1.2 Sidebar (`src/components/layout/sidebar.tsx`)
- **Ancho**: `w-64` (Expandido) / `w-[64px]` (Colapsado).
- **Estilo**: `bg-card` (Blanco). Items activos con background de color primario.
- **Padding**: Excesivo (`px-5`, `mb-6`, `px-3` interno). Genera mucho "aire muerto" vertical.
- **Densidad**: Items de navegación tienen `py-1.5` + margen. Se puede compactar.

### 1.3 Page Content
- **Padding Global**: `px-4 py-4` (definido en `app-layout.tsx`).
- **Cards**: Muchas cards usan `p-6` por defecto. Incompatible con "Compact Default".

## 2. Auditoría de Tablas (Componentes)

Actualmente no hay un componente único. Se encontraron tablas hardcodeadas o usando componentes ad-hoc en:
- `logistics/orders/page.tsx`: Tabla manual con `<table>`.
- `finances/ledger/page.tsx`: Tabla manual.
- `marketing/facebook-ads/page.tsx`: Tabla manual.

**Problemas Comunes**:
- Altura de fila variable (`h-12` a veces).
- Headers no sticky.
- Badges con colores semáforo variados (algunos `bg-green-100`, otros `bg-emerald-50`).
- Acciones desalineadas.

## 3. Colores Hardcodeados (Deuda Técnica)

Se han identificado patrones de colores legacy que deben ser eliminados en favor de las nuevas variables semánticas:
- **Indigo/Violet**: Usado en botones "primary" antiguos (`bg-indigo-600`).
- **Emerald**: Usado para estados "Active".
- **Slate variados**: Inconsistencia en bordes (`slate-100`, `slate-200`, `slate-300`).

## 4. Plan de Acción: Densidad Global & Unificación

### 4.1 Variables CSS (`globals.css`)
Implementaremos un sistema de variables para controlar la densidad globalmente:

```css
:root {
  /* Colors */
  --primary: #0f172a; /* Slate 900 (Unified Accent) */
  --primary-foreground: #f8fafc;
  
  /* Density Variables */
  --header-height: 56px;
  --sidebar-width: 240px; /* Reduced from 256px */
  --sidebar-width-collapsed: 56px; /* 64px -> 56px */
  
  --space-page: 16px; /* p-4 */
  --space-card: 16px; /* p-4 instead of p-6 */
  --space-gap: 8px;   /* gap-2 */
  
  --height-input: 32px; /* h-8 standard */
  --height-row: 36px;   /* Compact rows */
}
```

### 4.2 Componente Canónico `DataTable`
Crearemos `src/components/ui/data-table.tsx` que fuerce:
- `sticky top-0` en headers.
- `h-[var(--height-row)]` en filas.
- `text-xs` en celdas.
- Bordes `border-slate-100`.

### 4.3 Bugfix Header
- Eliminar `max-w` hardcodeados en selectores del TopBar.
- Usar `flex-shrink` controlado.
- Ajustar truncamiento para priorizar el nombre de la tienda sobre el label "TIENDA".
