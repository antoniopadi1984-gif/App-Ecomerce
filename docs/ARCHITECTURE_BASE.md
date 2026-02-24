# Architecture Base - Immutable Foundation

## Core Philosophy
This application is designed as a **Multi-Store SaaS** platform for e-commerce management. It enforces a strict separation between global user data and per-store operational data.

## 1. Data Hierarchy

### Global Context (User Level)
Data that belongs to the authenticated user, independent of which store is currently active.
- **User**: Authentication, roles, and global profile.
- **UserStoreAccess**: Permission matrix linking Users to specific Stores.
- **UserConnection**: Global API keys for services that are shared across all stores (e.g., OpenAI, Replicate, if configured globally).
- **AiUsageLog**: Tracking costs and usage across the entire account.

### Local Context (Store Level)
Data encapsulated within a specific `Store`. Most operational modules (Orders, Products, Finances) live here.
- **Store**: The root container for a specific Shopify/Beeping operation.
- **Product**: Inventory units within a store. Includes `ProductFinance` (COGS, VAT).
- **Order / OrderItem**: Transacional data synchronized from Shopify or Beeping.
- **Customer**: CRM profiles specific to a store's audience.
- **FulfillmentRule**: Logistics configuration (carriers, costs, zones).
- **DailyFinance**: Aggregated financial metrics and ad spend.
- **Connection**: Store-specific API keys (Shopify, Meta Ads, Beeping).

---

## 2. Immutable Data Models

### Store (`model Store`)
- **ID**: Primary key (`cuid`).
- **Context**: Must be passed explicitly as `storeId` in all server actions.
- **Currency**: Foundation for all calculations (Default: EUR).

### Product (`model Product`)
- **Uniqueness**: Identified by `shopifyId` or SKU.
- **Financial Layer**: Every product should have an associated `ProductFinance` record for accurate profit calculation.

### Provider / Supplier (`model Supplier`)
- Linked to products for supply chain tracking.

---

## 3. Development Protocols

### Multi-Store Context (`getStoreOrThrow`)
All server actions MUST utilize the active `storeId`.
```typescript
// Standard pattern
export async function getLocalOrders(storeId: string) {
    const store = await getStoreOrThrow(storeId);
    return prisma.order.findMany({ where: { storeId: store.id } });
}
```

### UI Consistency
- All components MUST use `tokens.ts` for styling.
- Inline colors are prohibited.
- Padding and Margins are strictly controlled via `PageShell` and `ModuleHeader`.

---

## 4. Spacing Scale (Compact)
- **XS**: 8px (Inner items, gaps)
- **SM**: 12px (Standard card padding)
- **MD**: 16px (Section gaps, main padding)
- **LG**: 24px (Large layout separators)
