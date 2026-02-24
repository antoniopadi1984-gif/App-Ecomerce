
# 🛡️ Control de Integraciones y Secretos

**Fecha del Reporte:** 2026-02-15
**Estado:** FASE 1 COMPLETADA (Inventario)

## 1. Resumen de Inventario (Real)

Este documento centraliza el estado actual de todas las integraciones detectadas en el código y en la base de datos.
Cualquier secreto encontrado en texto plano (ENV o Código) se marca como **DEUDA TÉCNICA** a migrar al sistema de Vault cifrado.

### A. Reportes Generados
- 📄 **Secretos Detectados:** `docs/ops/SECRETS_USAGE_REPORT.txt` (Buscar "apiKey", "token", etc.)
- 📄 **Integraciones Detectadas:** `docs/ops/INTEGRATIONS_USAGE_REPORT.txt` (Buscar "shopify", "meta", etc.)
- 💾 **Conexiones en DB:** `docs/ops/CONNECTIONS_DB_REPORT.txt` (Listado por Store)

## 2. Matriz de Integraciones

| Proveedor | Estado Código | Estado DB | Acción Requerida |
| :--- | :--- | :--- | :--- |
| **Shopify** | Detectado en `src/lib/shopify.ts` | ✅ En Vault (Ver DB Report) | Validar rotación de keys. |
| **Meta Ads** | Detectado en `src/lib/marketing/meta-ads.ts` | ⚠️ Plaintext/Env (Revisar logs) | Migrar a Vault. |
| **Beeping** | Detectado en `src/lib/beeping.ts` | ❓ Verificar | Centralizar en `connections.ts`. |
| **Google Gemini** | Detectado en `src/lib/gemini-adapter.ts` | ❓ Verificar | Migrar API Key a Vault. |
| **Google Drive** | Detectado en `src/lib/drive/` | ❓ JSON File? | Mover JSON a Vault (blob). |

## 3. Plan de Acción Inmediato (Fase 2)

1. **Centralización**: Todo acceso a API de terceros debe usar `getConnectionSecret(storeId, PROVIDER)`.
2. **Eliminación de ENV**: Las variables de entorno para credenciales específicas de cliente (`SHOPIFY_API_KEY`, etc.) deben eliminarse tras la migración.
3. **UI de Gestión**: Habilitar `/connections` para permitir a los admins rotar credenciales sin deploy.

## 4. Evidencia de Ejecución

Ver archivos adjuntos en `docs/ops/`.
