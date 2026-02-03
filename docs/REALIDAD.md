# Mapa de Realidad - Ecombom Control (Fase 0)

Este documento detalla el estado real de implementación de cada módulo de la aplicación.

## 🟢 REAL (100% Funcional con evidencia en código)

- **Shopify Sync**: Implementado en `src/lib/shopify.ts` y `src/app/logistics/orders/actions.ts`. Soporta importación de productos, pedidos normales, carritos abandonados y borradores.
- **Logística (Beeping)**: Integración directa via `BeepingClient` en `src/lib/beeping.ts`. Soporta exportación de pedidos y sincronización de estados.
- **Logística (Dropi/Dropea)**: Clientes implementados en `src/lib/dropi.ts` y `src/lib/dropea.ts`.
- **Contabilidad v1**: Motor de snapshots en `src/lib/services/snapshot-service.ts`. Genera vistas por fecha de creación y fecha de entrega.
- **Comunicaciones (WhatsApp)**: Integración con WABA via `whatsapp-service.ts`. Soporta envío de mensajes por categorías (servicio, marketing) y seguimiento de costes.
- **Inbox / Chat**: UI y acciones en `src/app/communications/inbox`. Permite chat manual y modo IA (Clowdbot).
- **Clowdbot Engine**: Motor de procesamiento de mensajes en `src/lib/clowdbot-engine.ts`.
- **Motor Python (FFmpeg)**: Servidor FastAPI en `src/engine/server.py` con endpoints reales para limpieza de metadata y concatenación de vídeos (Frankenstein).
- **Gemini Vision**: Análisis de vídeo real integrado en el motor Python usando Gemini 1.5 Flash/Pro.

## 🟡 PARCIAL (Implementado pero con limitaciones o "mentiras técnicas")

- **Meta Ads**: El servicio en `marketing/meta-ads.ts` es correcto, pero la validación de token es superficial. El reporte de métricas intradía es real pero depende de la estabilidad del token.
- **VideoLab**: Las herramientas de edición son reales (FFmpeg), pero no hay previsualización dinámica estable antes de procesar.
- **Geocodificación**: Implementada via Google Maps, pero puede fallar si la dirección de Shopify es muy pobre.
- **Atribución UTM**: Algoritmo robusto en `extractUtms`, pero falible si el cliente navega mucho entre sesiones sin landing site claro.

## 🔴 OFF / BLOQUEADO (Prometido en UI pero no implementado o desactivado)

- **Avatar Synthesis**: Los endpoints de generación de avatares en `src/engine/server.py` devuelven error 501 (Not Implemented). Desactivado hasta Fase 5.
- **Lip-sync en Mac M3**: No hay motor de lip-sync estable sin GPU NVIDIA por ahora. Marcado como bloqueado.

## ⚖️ "Mentiras Técnicas" Detectadas

1. **Visitantes Estimados**: El CP (Control Panel) calcula visitantes como `0.5 * (landing_page_views o clicks)`. No es un dato real de analytics, es una estimación.
2. **Success Falsos**: Algunos jobs de sincronización indican "completado" aunque la API externa devuelva error de cuota o token, si no se captura el error granularmente.
3. **Cálculo de COGS**: Si un producto no tiene coste unitario en `productFinance`, se asume 0, inflando el beneficio artificialmente.
