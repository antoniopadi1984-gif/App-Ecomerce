# Diagnóstico de Producto — Documentación

## Ruta
`/productos/{id}/diagnostico`

## API
- `GET /api/productos/{id}/diagnostico` — devuelve producto con finance, supplier, links, sources, store + connections
- `POST /api/productos/{id}/diagnostico` — ejecuta acción de diagnóstico

## Acciones disponibles

| Acción | Tipo | Qué hace | AuditLog |
|---|---|---|---|
| `SAVE_COMPETITOR_LINKS` | REAL | Borra y recrea CompetitorLinks | `DIAG_LINKS_SAVED` |
| `GENERATE_NOMENCLATURE` | REAL | Genera nomenclatura basada en template del Store | `DIAG_NOMENCLATURE` |
| `CREATE_DRIVE_FOLDER` | STUB | Verifica si hay Service Account, crea placeholder | `DIAG_DRIVE_FOLDER` |
| `UPLOAD_ASSET` | STUB | Registra intento (sin upload real) | `DIAG_ASSET_UPLOAD` |

## Vista UI
Panel con 4 secciones:
1. **Datos del Producto (BD)** — título, handle, PVP, coste, proveedor, estado, drive folder, ID
2. **ProductFinance** — coste, PVP, envío, devolución, packaging, COD fee
3. **Estado de Conexiones del Store** — cards con status activa/inactiva
4. **Acciones de Diagnóstico** — 4 botones, cada uno ejecuta y muestra resultado con OK/STUB/FAIL
5. **Resultados** — log de las acciones ejecutadas en esta sesión

## Verificar con Producto Limpio
```
http://localhost:3000/productos/product-limpio/diagnostico
```
Este URL funciona directamente tras ejecutar `npx prisma db seed`.
