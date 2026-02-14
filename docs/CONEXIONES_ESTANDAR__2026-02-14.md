# Conexiones Estándar — Documentación

## API de Test
`POST /api/connections/test`

### Request
```json
{ "provider": "SHOPIFY", "connectionId": "optional-id" }
```

### Response
```json
{
  "provider": "SHOPIFY",
  "status": "OK" | "FAIL" | "STUB",
  "message": "Conectado: My Store",
  "latencyMs": 234
}
```

## Providers implementados

| Provider | Test real | Qué verifica |
|---|---|---|
| SHOPIFY | ✅ | `GET /admin/api/2024-01/shop.json` con token |
| META | ✅ | `GET /v19.0/me` con access token |
| BEEPING | ✅ | `GET /shipments?limit=1` con API key |
| GOOGLE_SHEETS | ⚠️ STUB | Parsea JSON de Service Account |
| REPLICATE | ✅ | `GET /v1/account` con bearer token |
| Otros | ❌ | Devuelve STUB con mensaje |

## UI
Cada tarjeta de conexión activa en `/connections` muestra un botón **Test** que:
1. Llama al API con el provider
2. Muestra toast con resultado (OK verde / FAIL rojo / STUB amarillo)
3. Registra la acción en AuditLog

## Cada test registra en AuditLog:
- action: `CONNECTION_TEST`
- entity: `CONNECTION`
- entityId: provider name
- newValue: JSON con status, message, latencyMs
