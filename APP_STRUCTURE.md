# Estructura de la Aplicación (Ecombom Control)

Este documento detalla la estructura actual de menús, rutas y funcionalidades principales de la plataforma.

## Menú Principal (SISTEMA OPERATIVO)

| Menú | Ruta | Descripción |
| :--- | :--- | :--- |
| **Lanzamiento MVP** | `/marketing/mvp-wizard` | Asistente de inteligencia para lanzar productos mínimos viables de forma ultra-rápida. |
| **Centro de Comando** | `/` | Dashboard principal con KPIs clave (Ventas, ROI, Pedidos) y vista general. |
| **Rendimiento Ads** | `/marketing/performance` | Análisis profundo de rendimiento de pauta publicitaria (Meta/Shopify). |
| **Contabilidad** | `/finances` | Gestión financiera, control de costes, márgenes y P&L en tiempo real. |
| **Pedidos** | `/logistics/orders` | Gestión centralizada de pedidos, estados de entrega y logística. |
| **Investigación** | `/marketing/research` | Laboratorio de investigación forense (DNA de producto, VOC, Cape Layer). |
| **Páginas** | `/marketing/landing-lab` | Gestión y despliegue de landing pages optimizadas para conversión. |
| **Clientes** | `/customers` | Base de datos de clientes y análisis de comportamiento de compra. |
| **Contenido** | `/marketing/creative-lab` | Factoría de contenido creativo (Frankenstein Creatives, Hooks, Vídeos). |
| **Anuncios** | `/marketing/ad-spy` | Espionaje ético de competencia y análisis de anuncios ganadores. |
| **Avatares** | `/marketing/avatars-lab` | Definición psicográfica de avatares de cliente basados en investigación forense. |
| **WhatsApp** | `/communications/inbox` | Inbox unificado para gestión de ventas y soporte vía WhatsApp. |
| **Clowdbot** | `/marketing/clowdbot-lab` | Centro de control de agentes de IA y automatizaciones inteligentes. |
| **Estadísticas** | `/analytics` | Reportes estadísticos avanzados de toda la operación. |
| **Equipo y Rendimiento** | `/team` | Gestión de miembros del equipo, accesos y métricas de rendimiento interno. |
| **Conexiones** | `/connections` | Centro de integración de APIs (Shopify, Beeping, Meta, Google Drive). |
| **Ajustes** | `/logistics/settings` | Configuración global del sistema y parámetros operativos. |

## Estructura de Capas Técnicas

- **Fase de Datos (`src/lib`)**: Lógica de negocio, scrapers, orquestadores de investigación y servicios de IA.
- **Capa Visual (`src/components`)**: Componentes de UI premium (ShadcnUI + Tailwind) organizados por dominios.
- **Rutas de API (`src/app/api`)**: Endpoints de backend para procesamiento de trabajos, conexiones y utilidades.
- **Motores Externos (`src/engine`)**: Scripts y servicios auxiliares (procesamiento de vídeo, generación de imágenes).

---
*Documento generado para integración con Claude/Modelos de IA.*
