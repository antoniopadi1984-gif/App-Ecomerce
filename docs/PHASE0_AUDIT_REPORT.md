# Phase 0 Audit Report - Technical Validation

## 1. Global Color Audit
**Status: NON-COMPLIANT**

### Found Hex Inline / Hardcoded Colors:
- **Primary Pink (`#fb7185`)**: 50+ instances (e.g., `src/app/research/page.tsx`, `src/components/marketing/clowdbot-config.tsx`).
- **Background Gray (`#F0F2F5`, `#fcfcfd`, `#F8FAFC`)**: Widespread across `app-layout.tsx` and almost all route pages.
- **Dark Surface (`#05060f`, `#0a0a0a`)**: Used in video and ads moderator modules.
- **Stroke/Fill Colors**: Hardcoded hex in SVG icons/charts (e.g., `src/app/logistica/page.tsx`).

### Recommendation:
- Replace all `#fb7185` with `COLORS.primary`.
- Replace all background hex with `COLORS.bg` or `COLORS.surfaceMuted`.
- Standardize all dark themes into `tokens.ts`.

---

## 2. Spacing Audit
**Status: NON-COMPLIANT**

### Found Off-Scale Values (Scale: 8, 12, 16, 24px / TW: 2, 3, 4, 6):
- **Too Loose**: `p-8` (32px), `p-10` (40px), `p-12` (48px), `p-16` (64px), `p-20` (80px).
- **Too Tight / Fractional**: `p-0.5`, `px-1.5`, `py-1.5`, `gap-1`, `gap-1.5`.
- **Arbitrary**: `top-[80px]`, `h-[120px]`, `rounded-[2.5rem]`.

### Recommendation:
- Force-normalize all high-level containers to `p-4` (16px) or `p-6` (24px).
- Force-normalize all internal component pads to `p-2` (8px) or `p-3` (12px).
- Remove arbitrary pixel values in standard containers.

---

## 3. Structural Containment Audit
**Status: NON-COMPLIANT**

### Found Parallel Layouts / Redundant Wrappers:
- **Redundant BG in `app-layout.tsx`**: `bg-[#F0F2F5]` (Line 41) competes with `PageShell`.
- **Parallel Main Wrappers**: 10+ pages use `div className="min-h-screen"` instead of `PageShell`.
    - `src/app/marketing/static-ads-gen/page.tsx`
    - `src/app/finances/rules/page.tsx`
    - `src/app/system/health/page.tsx`
- **Inconsistent Scroller**: Some pages use `ScrollArea`, some use `overflow-y-auto` on a wrapper div.

### Recommendation:
- Clean `app-layout.tsx` to be a pure structural skeleton without hardcoded colors/background.
- Enforce `PageShell` as the **only** permitted top-level wrapper in `page.tsx` files.

---

## 4. Verification Plan
- **Phase 0.1**: Clean `app-layout.tsx`.
- **Phase 0.2**: systematic replacement of hex colors in `src/app` and `src/components`.
- **Phase 0.3**: normalization of `p-`, `m-`, `gap-` classes.
- **Phase 0.4**: Wrap all naked pages in `PageShell`.
- **Phase 0.5**: `npm run build` verification.
