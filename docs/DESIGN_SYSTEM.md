# Ecomerce App Design System (V1)

## Core Principles
1. **Consistency**: Use standardized components for layouts, headers, tables, and cards. Never invent one-off UI patterns.
2. **Compact Density**: Limit excessive whitespace. Use `gap-2`, `gap-3`, `gap-4` minimally, and prefer compact padding (`p-3`, `p-4`) within cards and tables.
3. **No Hardcoded Colors**: Always rely on Tailwind tokens. Do not use hex codes or arbitrary colors (e.g., `text-[#123456]`). Leverage `slate`, `indigo`, `rose`, `emerald`, and `amber`.

## Color Semantics
- **Backgrounds**: `bg-slate-50` for page backgrounds, `bg-white` for cards and foreground elements.
- **Borders**: `border-slate-200` for standard borders, `border-slate-100` for subtle dividers.
- **Primary Text**: `text-slate-900`
- **Secondary/Mute Text**: `text-slate-500` or `text-slate-400`
- **Brand/Accent**: `indigo-500` / `indigo-600`
- **Success (OK)**: `emerald-500` / `emerald-600`
- **Warning**: `amber-500`
- **Critical/Destructive**: `rose-500` / `rose-600`

## Typography
- **Headings**: Use `font-black`, `uppercase`, `tracking-tight` (or `tracking-widest` for small headers). Optional `italic` for stylistic flair.
- **Micro-Copy**: Use `text-[10px]` or `text-[11px]`, `uppercase`, `tracking-widest`, `font-bold` for labels, table headers, and tags.

## Base Components
- **`PageShell`**: Standardizes the outermost layout. Manages the main container, max-width, and scrolling area.
- **`ModuleHeader`**: Renders the title, icon, description, and primary CTA/Actions.
- **`SectionCard` / `KpiCard`**: Uniform wrapping for groups of data. Applies standard border, shadow, and padding (`p-4`).
- **`DataTableCompact`**: Uses tight padding (`h-8` cells), small text (`text-[11px]`), and avoids enormous gaps between rows.

## State Management UI
- **Loading State**: Render a centered spinner (Lucide `Loader2` `animate-spin`) accompanied by a micro-copy label (e.g., `CARGANDO DATOS...`).
- **Empty State**: Clear container with a subtle icon and text explaining there is no data, providing a CTA to add data if applicable.
- **Error State**: Render an `AlertTriangle` or `AlertCircle` (`text-rose-500`) with a brief error description and a "Retry" CTA.
- **Not Configured (Unconnected) State**: If an underlying integration is missing, replace the dashboard entirely with a "Connect Service" CTA card pointing to `/connections`. NEVER show a broken or "0" stats dashboard if the service simply isn't linked.
