# Producto Limpio — Documentación de Seed

## Propósito
El seed crea un producto de prueba completo con todas las entidades relacionadas para validar el sistema end-to-end sin depender de datos reales de Shopify.

## Ejecutar
```bash
npx prisma db seed
```

## Entidades creadas

| Entidad | ID fijo | Datos principales |
|---|---|---|
| Store | `store-limpio` | "Tienda Limpia (Fase 0)", EUR |
| User | `user-limpio` | admin@ecombom.test, ADMIN |
| Supplier | `supplier-limpio` | Proveedor Test AliExpress |
| Product | `product-limpio` | PVP 39.99€, Coste 8.50€, Active |
| ProductFinance | — | Shipping 4.50€, Return 6€, CPA 12€ |
| CompetitorLink | x3 | Amazon, AliExpress, Competitor |
| ResearchSource | x3 | Review, Forum, Article |
| Connection | x5 | Shopify, Sheets, Meta, Beeping, Replicate (todas inactivas) |
| AuditLog | — | Registro del seed |

## Idempotencia
El seed usa `upsert` para todas las entidades con ID fijo. Se puede ejecutar múltiples veces sin duplicar datos.

## Verificar
```bash
npx prisma studio
# → Navegar a Product, buscar "product-limpio"
# → Verificar ProductFinance, CompetitorLinks, etc.
```
