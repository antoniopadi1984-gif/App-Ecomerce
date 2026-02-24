# UI Debt Audit Report

This document outlines the screens currently available in the topbar and sidebar navigation that do NOT meet the UI standardization criteria defined in `FEATURE_DONE_DEFINITION.md` and `DESIGN_SYSTEM.md`. 

**Standard Criteria:**
- 1. Uses `PageShell` for layout and constrained scrolling.
- 2. Uses `ModuleHeader` for title, subtitle, icon, and actions.
- 3. Uses Connection Registry logic to handle loading, empty, and non-configured states correctly (e.g. `checkConnection`).
- 4. Avoids hardcoded colors outside of standard state palettes (Emerald/Amber/Rose) for status badges and Indigo for branding.
- 5. High-density standard components (e.g. `SectionCard`, `KpiCard`, `DataTableCompact`).

---

## 🛑 Screens Requiring Standardization

### 1. Dashboards Maestros
*   **Central Control (`/`)**
    *   **Status:** ✅ Compliant (Refactored)
*   **Profit & ROAS (`/rendimiento`)**
    *   **Status:** ✅ Compliant (Refactored)
*   **Stock & COGS (`/inventario`)**
    *   **Status:** ✅ Compliant (Refactored)

### 2. Ventas & Logística
*   **Pedidos Hub (`/pedidos`)**
    *   **Status:** ✅ Compliant (Previously refactored)
*   **Logística Pro (`/logistica`)**
    *   **Status:** ✅ Compliant (Refactored)
*   **CRM Forense (`/customers`)**
    *   **Status:** ✅ Compliant (Refactored)

### 3. Intelligence Lab
*   **Research Lab (`/research`)**
    *   **Status:** ✅ Compliant (Refactored)
*   **Ad Spy Deep (`/marketing/ad-spy`)**
    *   **Status:** ✅ Compliant (Refactored)
*   **Knowledge Base (`/creative/brain`)**
    *   **Status:** Pending Audit (Assume Non-Compliant based on siblings)

### 4. Fábrica de Activos
*   **Centro Creativo (`/centro-creativo`)**
    *   **Status:** ✅ Compliant (Previously refactored)
*   **Ads Manager (`/marketing` & `/marketing/facebook-ads`)**
    *   **Status:** ✅ Compliant (Refactored)
*   **Static Ads QA (`/marketing/ads-moderator`)**
    *   **Status:** ✅ Compliant (Refactored)

### 5. God-Tier AI
*   **Escuadrón IA (`/agentes-ia`)**
    *   **Status:** ✅ Compliant (Previously refactored)

### 6. Sistema
*   **Equipo (`/team`)**
    *   **Status:** ✅ Compliant (Refactored)

---

## 🎯 Next Steps & Recommendations

1.  **Iterative Refactoring:** Process each non-compliant screen one by one.
2.  **Structural Updates:** Wrap contents in `<PageShell>` replacing custom `min-h-screen` divs.
3.  **Header Replacement:** Swap custom `div` headers with `<ModuleHeader title="..." subtitle="..." icon={...} />`.
4.  **Connection Registration:** Wrap module logic in a check via `fetch('/api/connections/status?service=...')` where applicable, rendering the "Not Configured" state via `PageShell` if missing.
5.  **Color Auditing:** Remove raw Hex colors (`#fb7185`, `#050505`, etc.) and non-standard generic colors from text unless used within semantic Notification/Badge elements.
