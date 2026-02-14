
# Plan de Migración - Research Lab V4

## Fase A: Preparación (NO TOCAR PRODUCCIÓN)
1. **Branch Management**:
   - Crear branch: `feature/research-lab-v4` desde `main`.
   - **NO MERGE** a `main` hasta completar todas las fases de testing.

2. **Backup & Safety**:
   - Backup completo de Base de Datos.
   - Snapshot de la configuración actual de `marketing/research`.
   - Documentación de flows críticos actuales para asegurar no regresión.

3. **Auditoría Previa (Completada/En Progreso)**:
   - Mapeo de rutas, componentes y APIs existentes (`AUDIT_COMPLETE__2026-02-14.md`).
   - Identificación de código legacy a refactorizar.

## Fase B: Implementación Incremental (Módulo por Módulo)

### B.1: Infraestructura Base
- [ ] Crear estructura de directorios V4: `/src/app/dashboard/products/[id]/...`
- [ ] Implementar Layout común (`DashboardLayout.tsx`, `Sidebar.tsx`).
- [ ] Configurar Context de Producto (`ProductContext`).

### B.2: Migración de Research Lab
- [ ] Refactorizar `ResearchLab.tsx` monolítico a componentes atómicos:
    - [ ] `ResearchConfig`
    - [ ] `ResearchPipeline`
    - [ ] `ResearchResults`
- [ ] Mover rutas de API a `/api/products/[id]/research`.
- [ ] Adaptar llamadas a API existentes para usar `productId`.
- [ ] **Test**: Verificar que la data antigua carga en la nueva estructura.

### B.3: Integración de Creative Factory
- [ ] Mover componentes de `/marketing/creative-lab` a `/dashboard/products/[id]/creative`.
- [ ] Enlazar `CreativeGenerator` con los resultados de `ResearchLab`.
- [ ] **Test**: Generar un creativo usando data de research migrada.

### B.4: Unificación de Financials & Orders
- [ ] Crear vistas contextuales de `/dashboard/orders` filtradas por producto.
- [ ] Migrar componentes de `FinancialDashboard` a `/dashboard/products/[id]/financials`.
- [ ] **Test**: Verificar cálculos de profit por producto.

## Fase C: Testing & Validación
1. **Developer Testing**:
   - Unit tests para utilidades críticas (`calculations`, `data-transform`).
   - Smoke testing de navegación V4.

2. **Staging con Data Real**:
   - Desplegar branch en entorno de staging (si existe) o local con DB prod clonada.
   - Verificar integridad de datos históricos.

3. **User Acceptance Testing (Antonio)**:
   - Demo completa de flujo: Crear producto -> Research -> Creative -> Profit.
   - Validación de UI/UX en móvil y desktop.

## Fase D: Deploy & Rollout
1. **Soft Launch**:
   - Habilitar nuevas rutas en paralelo a las antiguas (temporalmente).
   - Redireccionar usuarios beta a V4.

2. **Full Migration**:
   - Reemplazar rutas antiguas con redirecciones permanentes a V4.
   - Eliminar código muerto/legacy.
   - Monitorización intensiva de logs de error (Sentry/Vercel Logs).

## Criterios de Aceptación por Feature
- [ ] **Funcionalidad**: Hace exactamente lo que hacía la V3 + mejoras V4.
- [ ] **Performance**: Carga en < 1.5s (LCP). Code splitting verificado.
- [ ] **Data Integrity**: Ningún dato perdido en la migración.
- [ ] **UX**: UI Premium, Responsive perfecto, Feedback claro (loading/error).
- [ ] **Código**: TypeScript estricto, sin `any`, modular y documentado.
