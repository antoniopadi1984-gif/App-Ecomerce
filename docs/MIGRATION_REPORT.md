# Reporte de Migración: Arquitectura Multi-Agente Especializada
Referencia: `/docs/MIGRATION_REPORT.md` (Version 1.1)

## 📋 Resumen Ejecutivo
Se ha implementado una arquitectura de IA de tres niveles (Tiered Architecture) para optimizar la calidad del output, la latencia y los costos operativos. El sistema ahora selecciona dinámicamente entre Anthropic (Claude 3.5 Sonnet) y Google Vertex AI (Gemini 1.5 Pro/Flash) según la naturaleza de la tarea.

## 🏗️ Arquitectura de 3 Niveles (Tiers)

| Tier | Especialidad | Modelo IA | Ventaja |
| :--- | :--- | :--- | :--- |
| **Tier 1: Creatividad** | Copywriting, Scripts, CRO | Claude 3.5 Sonnet | Máxima persuasión y naturalidad humana. |
| **Tier 2: Inteligencia** | Investigación Forense | Gemini 1.5 Pro | Ventana de contexto masiva y razonamiento profundo. |
| **Tier 3: Operaciones** | Soporte, Logística, Contabilidad | Gemini 1.5 Flash | Velocidad extrema y reducción de costos (17x más barato). |

## 🛠️ Cambios Implementados

### 1. Configuración Centralizada (`/src/lib/config/api-config.ts`)
- Se ha eliminado la dispersión de variables de entorno.
- Nueva estructura `API_CONFIG` que contiene credenciales, modelos estables y parámetros de cada proveedor.
- Función `getVertexAIEndpoint` integrada para peticiones REST deterministas.

### 2. Registro de Agentes (`/src/lib/agents/agent-registry.ts`)
- Definición de **25 roles especializados**.
- Cada agente tiene su propio `systemPrompt` optimizado, temperatura y configuración de tokens.
- Clasificación por Tier y Cost Tier (Premium, Standard, Economic).

### 3. Despachador Inteligente (`/src/lib/agents/agent-dispatcher.ts`)
- Lógica de enrutamiento multi-proveedor (Anthropic/Google).
- **Cálculo de costos en tiempo real** integrado en cada respuesta.
- Implementación de `dispatchTo` y `dispatchAuto` para uso simplificado.

### 4. Router de IA Core (`/src/lib/ai/router.ts`)
- Migrado para usar el sistema de agentes.
- Mapeo persistente de `TaskType` a `AgentRole`.
- Registro detallado de uso en base de datos (`AiUsageLog`) incluyendo costo estimado por tarea.

### 5. Adaptadores de Compatibilidad (Legacy)
- `src/lib/ai.ts`: La función `askGemini` ahora es un adaptador que redirige al dispatcher, manteniendo vivos todos los módulos de marketing existentes.
- `src/lib/gemini.ts`: `GeminiService` redirige sus llamadas al sistema de agentes de forma transparente.

## 📊 Impacto Operativo
- **Costos**: Reducción masiva en tareas operativas al moverlas a Gemini 1.5 Flash.
- **Calidad**: Mejora drástica en Creative Lab al usar Claude para copywriting.
- **Observabilidad**: El endpoint `/api/health` ahora muestra estadísticas granulares de los agentes.

## ✅ Estado del Sistema
- **Anthropic**: Configurado y Validado.
- **Vertex AI (Pro/Flash)**: Configurado y Validado.
- **Agentes**: 25/25 Roles Operacionales.
- **Health Check**: Activo y con monitoreo de Tiers.

---
*Fin del reporte.*
