# Auditoría Central — Documentación

## Librería
`src/lib/audit.ts` — exporta:
- `logAudit(entry)` → logging completo con serialización JSON automática
- `logAuditSimple(storeId, action, entity, entityId, details?)` → versión simplificada

## Integrado en:
- ✅ Conexiones: CRUD (create/update/delete) en `connections/actions.ts`
- ✅ Tests de conexión en `api/connections/test/route.ts`
- ✅ Diagnóstico de producto en `api/productos/[id]/diagnostico/route.ts`
- ✅ Seed ejecutado en `prisma/seed.ts`

## Modelo de datos
```prisma
model AuditLog {
  id        String   @id @default(cuid())
  storeId   String
  userId    String?
  action    String       // CONNECTION_TEST, SEED_EXECUTED, etc.
  entity    String       // CONNECTION, PRODUCT, SYSTEM, DIAGNOSTICO
  entityId  String       // ID del recurso afectado
  oldValue  String?      // JSON del valor anterior
  newValue  String?      // JSON del nuevo valor
  actorType String       // HUMAN | IA | SYSTEM
  createdAt DateTime
}
```

## Vista UI
- Ruta: `/settings/audit`
- Filtros: por entidad, búsqueda por action/entityId
- API: `GET /api/settings/audit?entity=CONNECTION&search=TEST`
