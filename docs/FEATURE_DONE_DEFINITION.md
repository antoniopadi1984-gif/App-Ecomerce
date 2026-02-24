# Feature Definition of Done (DoD)

To consider any screen or feature "Done" in this application, it must satisfy all the following criteria:

## 1. Zero "Fake" States
- The screen must reflect real data powered by the backend.
- It must fetch its connection or configuration status from the canonical `Connection Registry`.

## 2. Standardized UI
- The screen is wrapped in the `<PageShell>` component.
- The title area uses `<ModuleHeader>`.
- Any cards use `<SectionCard>` or `<KpiCard>`.
- Any tables use `<DataTableCompact>` or adhere strictly to the `DESIGN_SYSTEM.md` dense table rules.
- **No hardcoded hex colors** exist in the component. Extraneous padding/margin (e.g., `py-20`, `gap-10`) is removed or minimized.

## 3. Mandatory Handled States
The feature must explicitly implement and render a UI for all 4 states:
1. **[ ] Loading State**: Appears during initial data fetch.
2. **[ ] Error State**: Catches runtime/fetch errors and allows retry or recovery.
3. **[ ] Empty State**: Appears when data is correctly fetched but the set is empty (e.g., 0 orders).
4. **[ ] Not Configured State**: If the feature relies on an external integration (e.g., Meta Ads, Shopify, Beeping), it must check `useConnectionRegistry` (or similar). If not connected, it halts rendering the dashboard and provides a CTA to `/connections`.

## 4. Stability
- Types are correctly defined (minimal `any`).
- Builds successfully (`npm run build` exits with 0).
- No console errors or warnings in standard operation.
