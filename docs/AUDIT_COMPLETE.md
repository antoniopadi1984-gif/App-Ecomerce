# Auditoría Completa del Sistema - 2026-02-10

## 1. Rutas Existentes
*Analizado desde: audit/routes.txt*

- `src/app/accounting/page.tsx`: Panel contable principal.
- `src/app/api/...`: Endpoints de API.
- `src/app/chat-test/page.tsx`: Test de chat.
- `src/app/dashboard/accounting/page.tsx`: Dashboard contable.
- `src/app/dashboard/financials/page.tsx`: Financieros.
- `src/app/dashboard/layout.tsx`: Layout principal del dashboard.
- `src/app/dashboard/logistics/page.tsx`: Logística.
- `src/app/dashboard/orders/page.tsx`: Gestión de pedidos.
- `src/app/dashboard/page.tsx`: Home del dashboard.
- `src/app/dashboard/products/page.tsx`: Lista de productos.
- `src/app/dashboard/products/[id]/page.tsx`: Detalle de producto.
- `src/app/dashboard/settings/page.tsx`: Configuración.
- `src/app/login/page.tsx`: Login.
- `src/app/maestro/page.tsx`: Maestro Workspace.
- `src/app/marketing/avatars-lab/page.tsx`: Laboratorio de Avatares.
- `src/app/marketing/creative-lab/page.tsx`: Laboratorio Creativo.
- `src/app/marketing/research/ResearchLab.tsx`: Componente principal de Research (Actualmente usado como página en routing).
- `src/app/marketing/research/page.tsx`: Página contenedora de ResearchLab.
- `src/app/page.tsx`: Landing/Home root.
- `src/app/video-lab/page.tsx`: Laboratorio de Video.

**Observación**: Existe dispersión en la estructura. `marketing/research` y `marketing/creative-lab` están separados de la estructura `/products/[id]`. La propuesta de unificar todo bajo `/products/[id]/...` es crítica para la cohesión.

## 2. Componentes Principales
*Analizado desde: audit/components.txt*

### UI (shadcn/ui & base)
- `Accordion`, `Alert`, `AlertDialog`, `AspectRatio`, `Avatar`, `Badge`, `Button`, `Calendar`, `Card`, `Checkbox`, `Collapsible`, `Command`, `ContextMenu`, `Dialog`, `DropdownMenu`, `Form`, `HoverCard`, `Input`, `Label`, `Menubar`, `NavigationMenu`, `Popover`, `Progress`, `RadioGroup`, `ScrollArea`, `Select`, `Separator`, `Sheet`, `Skeleton`, `Slider`, `Switch`, `Table`, `Tabs`, `Textarea`, `Toast`, `Toggle`, `Tooltip`.

### Feature Components
- **Research**: `ResearchLab.tsx` (Monolito que debe refactorizarse), `ModuleCard` (Recién optimizado), `StructuredDataViewer`.
- **Marketing**: `AvatarsLab`, `CreativeLab`, `VideoLab`.
- **Financials**: `FinancialDashboard`, `ProfitWaterfall`, `CostCalculator`.
- **Logistics**: `LogisticsDashboard`, `OrderList`, `TrackingView`.

## 3. APIs Activas
*Analizado desde: audit/apis.txt*

- `/api/analyze`: Análisis general.
- `/api/auth/[...nextauth]`: Autenticación.
- `/api/chat`: Chatbot.
- `/api/cron/reminders`: Cron jobs.
- `/api/cron/sync-orders`: Sincronización de pedidos.
- `/api/elevenlabs/generate`: Generación de voz.
- `/api/finance/pl-statement`: P&L reports.
- `/api/integrations/drive/auth`: Auth Google Drive.
- `/api/integrations/drive/list`: Listar archivos Drive.
- `/api/integrations/drive/test-connection`: Test Drive.
- `/api/integrations/drive/upload`: Upload Drive.
- `/api/integrations/shopify/orders`: Pedidos Shopify.
- `/api/integrations/shopify/webhook`: Webhooks Shopify.
- `/api/marketing/...`: Múltiples endpoints de marketing (copy, angles, avatars).
- `/api/products`: CRUD productos.
- `/api/system/health`: Health checks.
- `/api/video-lab/...`: Procesamiento de video.

## 4. Features de Fraud Detection & Pedidos
*Analizado desde: audit/fraud-features.txt & audit/order-features.txt*

- Existen referencias a `fraudScore` en `Order` model (Prisma).
- `FraudAlert` component detectado en auditoría visual previa.
- Lógica de pedidos dispersa entre `/dashboard/orders`, `/api/integrations/shopify/orders` y `/api/cron/sync-orders`.

## 5. Conexiones API Activas
*Analizado desde: audit/api-calls.txt*

- **Meta Ads**: Referencias en `/lib/meta-ads.ts` (posiblemente).
- **Shopify**: Integración activa en `/lib/shopify.ts` y `/api/integrations/shopify`.
- **Google Drive**: Integración activa en `/lib/google-drive.ts` y endpoints relacionados.
- **Proveedores**: Referencias a `Dropi`, `Dropea`, `Beeping` en `src/lib/providers/...`.
- **OpenAI/Anthropic/Gemini**: `src/lib/gemini.ts` (Core AI provider).

## 6. Duplicados Potenciales
*Analizado desde: audit/potential-duplicates.txt*

- `page`: Múltiples archivos `page.tsx` (esperado en Next.js App Router).
- `route`: Múltiples archivos `route.ts` (esperado en API routes).
- `layout`: Múltiples layouts.
- Posible duplicación en lógica de "Research" entre `ResearchLab.tsx` y endpoints de API antiguos.

## 7. Propuesta de Consolidación (Mapping V4)

| Feature Actual | Ruta Actual | Nueva Ruta V4 (Propuesta) | Acción Requerida |
| :--- | :--- | :--- | :--- |
| Research Lab | `/marketing/research` | `/products/[id]/research` | Mover y parametrizar por ID |
| Creative Lab | `/marketing/creative-lab` | `/products/[id]/creative` | Mover y enlazar contexto producto |
| Avatars | `/marketing/avatars-lab` | `/products/[id]/research/avatars` | Integrar como sub-módulo |
| Financials | `/dashboard/financials` | `/products/[id]/financials` | Contextualizar por producto + Global view |
| Orders | `/dashboard/orders` | `/products/[id]/orders` | Contextualizar + Global view |

## 8. Estado Actual de Migración
- [x] Auditoría Inicial
- [ ] Backup de Base de Datos (Pendiente)
- [ ] Creación de Estructura de Directorios V4
- [ ] Migración de Componentes Core

