# FEATURE MAP — ECOMBOM CONTROL

> Auditoría completa de cada feature. Fecha: 2026-02-14.
> Criterio: ✅ OK = funciona end-to-end | ⚠️ PARCIAL = UI ok pero backend limitado | ❌ STUB = solo UI o placeholder | 🔴 OFF = deshabilitado

---

## 🏠 Core / Dashboard

| Feature | Ruta UI | Server Action / API | Modelo Prisma | Conexión Externa | Estado | Evidencia |
|---|---|---|---|---|---|---|
| Dashboard principal | `/` (`page.tsx`) | — | — | — | ✅ OK | Redirect a dashboard |
| Productos lista | `/productos` | `api/products` GET | `Product` | — | ✅ OK | CRUD real |
| Producto nuevo | `/productos/nuevo` | `api/products` POST | `Product` | — | ✅ OK | Formulario funcional |
| Producto detalle | `/dashboard/productos/[productId]` | `api/products/[id]` | `Product`, `ProductFinance` | — | ✅ OK | Vista completa |
| Pedidos lista | `/pedidos` | `api/orders` | `Order` | — | ✅ OK | Datos reales de Shopify |
| Pedidos fraude | `/pedidos/fraude` | — | `Order` (risk flags) | — | ⚠️ PARCIAL | UI lee datos pero no hay lógica de scoring propia |
| Clientes | `/customers` | `customers/actions.ts` | `Customer` | — | ✅ OK | CRUD real |
| Team | `/team` | `team/actions.ts` | `TeamMember` | — | ✅ OK | CRUD real |

---

## 💰 Finanzas

| Feature | Ruta UI | Server Action / API | Modelo Prisma | Conexión Externa | Estado | Evidencia |
|---|---|---|---|---|---|---|
| Dashboard financiero | `/finances` | `finances/actions.ts` | `DailyFinance`, `DailySnapshot` | — | ✅ OK | `page.tsx` 1584 líneas |
| Contabilidad | `/finances/accounting` | `api/finances/accounting` | `DailySnapshot` | — | ✅ OK | Snapshots reales |
| Ledger | `/finances/ledger` | `api/finances/ledger`, `ledger/actions.ts` | `LedgerEntry` | — | ✅ OK | Entradas reales |
| Profits | `/finances/profits` | `api/finances/profit-stats` | `Order` (profit fields) | — | ✅ OK | Profit real calculado |
| Hipótesis | `/finances/hypotheses` | — | `HypothesisScenario` | — | ⚠️ PARCIAL | UI ok, sin simulación backend |
| Reglas fulfillment | `/finances/rules` | `api/finances/rules` | `FulfillmentRule` | — | ✅ OK | CRUD real |
| Products finance | `/finances/products` | `api/products/[id]/financials` | `ProductFinance` | — | ✅ OK | Costes editables |
| AI Optimizer | `/finances/ai-optimizer` | `ai-optimizer/actions.ts` | — | Gemini | ⚠️ PARCIAL | Depende de Gemini key |
| Contabilidad (legacy) | `/contabilidad` | — | — | — | ❌ STUB | Redirect/placeholder |

---

## 📦 Logística

| Feature | Ruta UI | Server Action / API | Modelo Prisma | Conexión Externa | Estado | Evidencia |
|---|---|---|---|---|---|---|
| Orders dashboard | `/logistics/orders` | `logistics/orders/actions.ts` | `Order`, `OrderItem` | Shopify | ✅ OK | Sync real |
| Costes logística | `/logistics/costs` | — | `FulfillmentRule` | — | ✅ OK | Vista de reglas |
| Settings logística | `/logistics/settings` | — | `FulfillmentProvider` | — | ✅ OK | CRUD providers |
| Logística (legacy) | `/logistica` | — | — | — | ❌ STUB | Redirect/placeholder |
| Webhook Beeping | — | `api/webhooks/beeping` | `Order` | Beeping | ✅ OK | Recibe estados |
| Webhook genérico | — | `api/webhooks/generic-logistics` | `Order` | Varios | ✅ OK | Normalización |
| Full sync | — | `api/system/full-sync` | Múltiples | Shopify | ✅ OK | Sync completo |
| Logistics sync | — | `api/system/logistics-sync` | `Order` | Beeping | ✅ OK | Sync estados |

---

## 📢 Marketing

| Feature | Ruta UI | Server Action / API | Modelo Prisma | Conexión Externa | Estado | Evidencia |
|---|---|---|---|---|---|---|
| Marketing hub | `/marketing` | — | — | — | ✅ OK | Landing page módulos |
| Facebook Ads | `/marketing/facebook-ads` | `api/marketing/sync`, `performance` | `AdMetricDaily` | Meta API | ⚠️ PARCIAL | Funciona si token válido |
| Ad Spy | `/marketing/ad-spy` | `ad-spy/actions.ts` | `AdSpyCapture` | — | ✅ OK | Captura real |
| Ads Moderator | `/marketing/ads-moderator` | — | `SocialComment`, `SocialAction` | Meta/IG | ⚠️ PARCIAL | UI ok, moderación manual |
| Avatars Lab | `/marketing/avatars-lab` | `avatars-lab/actions.ts` | `AvatarProfile`, `AvatarAsset` | Replicate, ElevenLabs | ⚠️ PARCIAL | Generación depende de APIs externas |
| Avatars (legacy) | `/marketing/avatars` | — | `Avatar` | — | ❌ STUB | UI sin conexión real |
| Branding | `/marketing/branding` | — | `ProductBranding` | — | ⚠️ PARCIAL | Lectura real, generación IA parcial |
| Clowdbot Lab | `/marketing/clowdbot-lab` | `clowdbot-lab/actions.ts` | `ClowdbotConfig` | — | ✅ OK | Configuración funcional |
| Contents | `/marketing/contents` | `contents/actions.ts` | `ContentTemplate`, `ContentAsset` | — | ✅ OK | CRUD real |
| Contents > Automations | `/marketing/contents/automations` | — | `ContentCampaign` | — | ⚠️ PARCIAL | CRUD sin ejecución auto |
| Contents > Coupons | `/marketing/contents/coupons` | — | — | — | ❌ STUB | Solo UI |
| Contents > Courses | `/marketing/contents/courses` | — | `CourseLesson` | — | ⚠️ PARCIAL | CRUD parcial |
| Contents > Ebooks | `/marketing/contents/ebooks` | — | `ContentAsset` | — | ⚠️ PARCIAL | Upload sin generación |
| Copy Hub | `/marketing/copy-hub` | `copy-hub/actions.ts` | `CopyJob`, `CopyArtifact` | Claude/Gemini | ⚠️ PARCIAL | Depende de API key |
| Landing Lab | `/marketing/landing-lab` | `landing-lab/actions.ts` | `LandingProject`, `LandingSection` | — | ⚠️ PARCIAL | Editor sin preview real |
| MVP Wizard | `/marketing/mvp-wizard` | `mvp-wizard/actions.ts` | Múltiples | Gemini | ⚠️ PARCIAL | Wizard funciona, generación parcial |
| Static Ads | `/marketing/static-ads` | `static-ads/actions.ts` | `Creative` | — | ⚠️ PARCIAL | CRUD, generación vía Imagen |
| Static Ads Gen | `/marketing/static-ads-gen` | — | `Creative` | Vertex/Replicate | ⚠️ PARCIAL | UI generación de imágenes |
| Video Lab | `/marketing/video-lab` | `video-lab/actions.ts` | `VideoAsset`, `VideoClip` | Engine Python, Drive | ⚠️ PARCIAL | FFmpeg real, Drive parcial |
| Product Brain | `/marketing/product-brain` | `product-brain/actions.ts` | `KnowledgeNode` | — | ⚠️ PARCIAL | Grafo de conocimiento parcial |
| Creative Library | `/marketing/creative-library` | `api/creative/library` | `GeneratedCreative` | — | ✅ OK | Lectura de creativos |
| Performance | `/marketing/performance` | `api/marketing/performance` | `AdMetricDaily` | Meta API | ⚠️ PARCIAL | Depende de token Meta |
| AI Bridge | `/marketing/ai-bridge` | — | — | — | ❌ STUB | UI placeholder |
| Post Venta | — | `post-venta/actions.ts` | `ContentDeliveryLog` | WhatsApp | ⚠️ PARCIAL | Envío si hay token WA |
| Maestro | — | `maestro/actions.ts` | `MaestroAsset`, `MaestroScript` | — | ⚠️ PARCIAL | Pipeline creativo parcial |
| Economics | — | `economics/actions.ts` | `PricingOffer` | — | ✅ OK | Calculadora real |

---

## 🔬 Research

| Feature | Ruta UI | Server Action / API | Modelo Prisma | Conexión Externa | Estado | Evidencia |
|---|---|---|---|---|---|---|
| Research dashboard | `/research` | `api/products/[id]/research` | `ResearchProject`, `ResearchVersion` | — | ✅ OK | CRUD real |
| Avatares research | `/research/avatares` | — | `Avatar` | Gemini | ⚠️ PARCIAL | Generación depende IA |
| Competencia | `/research/competencia` | — | `CompetitiveAnalysis` | — | ⚠️ PARCIAL | CRUD, análisis manual |
| Config research | `/research/config` | — | `ResearchProject` | — | ✅ OK | Configuración |

---

## 💬 Comunicaciones

| Feature | Ruta UI | Server Action / API | Modelo Prisma | Conexión Externa | Estado | Evidencia |
|---|---|---|---|---|---|---|
| Inbox/Chat | `/communications/inbox` | `inbox/actions.ts` | `Conversation`, `Message` | WhatsApp API | ⚠️ PARCIAL | Funciona si hay token WA |
| Templates | `/communications/templates` | `templates/actions.ts` | `NotificationTemplate` | — | ✅ OK | CRUD real |

---

## 🔗 Conexiones

| Feature | Ruta UI | Server Action / API | Modelo Prisma | Conexión Externa | Estado | Evidencia |
|---|---|---|---|---|---|---|
| Panel conexiones | `/connections` | `connections/actions.ts`, `api/connections` | `Connection` | Múltiples | ⚠️ PARCIAL | CRUD ok, sin Test button |
| Google OAuth | — | `api/auth/google` | `Connection` | Google | ✅ OK | Flujo OAuth real |
| Service Account | — | `api/connections/service-account` | `Connection` | Google | ✅ OK | Upload JSON key |

---

## ⚙️ Settings / Sistema

| Feature | Ruta UI | Server Action / API | Modelo Prisma | Conexión Externa | Estado | Evidencia |
|---|---|---|---|---|---|---|
| Settings general | `/settings` | — | `Store` | — | ✅ OK | Configuración tienda |
| Clowdbot config | `/settings/clowdbot` | `clowdbot/actions.ts`, `api/clowdbot-config` | `ClowdbotConfig` | — | ✅ OK | CRUD real |
| Notifications | `/settings/notifications` | `notifications/actions.ts` | `NotificationTemplate` | — | ✅ OK | CRUD real |
| API Usage | `/settings/api-usage` | `api/usage/summary` | `ApiUsage` | — | ✅ OK | Métricas reales |
| System Health | `/system/health` | `api/system/health` | `SystemHeartbeat` | Engine, Worker | ✅ OK | Health checks reales |
| Eagle Eye | `/eagle-eye` | `eagle-eye/actions.ts` | `DailySnapshot` | — | ✅ OK | KPI dashboard |
| Analytics | `/analytics/master` | `analytics/actions.ts` | `AdMetricDaily`, `DailySnapshot` | — | ✅ OK | Dashboard analíticas |
| Analiticas (legacy) | `/analiticas` | — | — | — | ❌ STUB | Redirect/placeholder |
| Agentes IA | `/agentes-ia` | — | `AgentProfile` | — | ✅ OK | Gestión de agentes |
| Centro Creativo | `/centro-creativo` | — | — | — | ❌ STUB | Redirect/placeholder |

---

## 📊 Resumen

| Estado | Count |
|---|---|
| ✅ OK | 35 |
| ⚠️ PARCIAL | 25 |
| ❌ STUB | 6 |
| 🔴 OFF | 0 (flags en código pero no eliminados) |

### Stubs identificados (solo UI, sin backend real):
1. `/contabilidad` — redirect legacy
2. `/logistica` — redirect legacy
3. `/analiticas` — redirect legacy
4. `/centro-creativo` — redirect legacy
5. `/marketing/ai-bridge` — placeholder
6. `/marketing/contents/coupons` — solo UI
