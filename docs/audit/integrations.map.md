# Inventario Real de Integraciones

| Integración | Cliente | Ubicación | Estado Real | Notas |
| :--- | :--- | :--- | :--- | :--- |
| **Shopify** | Custom Fetch | `src/lib/shopify.ts` | REAL | Sincronización de pedidos y productos activa. |
| **Beeping** | Custom Fetch | `src/lib/beeping.ts` | REAL | Sincronización de logística (status y costos). |
| **Meta / FB** | Graph API | `src/lib/meta-ads.ts` | PARCIAL | Hay cliente pero mucha lógica usa `default-store`. |
| **Google Sheets** | Google SDK | `src/lib/google-sheets.ts` | REAL | Lectura de planes históricos. |
| **WhatsApp** | Custom API | `src/lib/whatsapp-service.ts` | MOCK/PARCIAL | Estructura para mensajes pero sin confirmación de envío real persistida. |
| **Replicate** | SDK | `src/lib/ai/replicate.ts` | PARCIAL | Usado en generación de videos/imágenes, pero con disparadores manuales. |
| **Dropea / Dropi**| Custom Fetch | `src/lib/dropea.ts` | PARCIAL | Clientes base disponibles pero sin uso intensivo en UI. |

**Estado Real definido por:**
- **REAL**: Llamada API + Persistencia en DB + UI operativa.
- **PARCIAL**: Código base existe pero la integración no está "cerrada" (falta persistencia o UI).
- **MOCK**: Datos hardcoded o `setTimeout` predominantes.
