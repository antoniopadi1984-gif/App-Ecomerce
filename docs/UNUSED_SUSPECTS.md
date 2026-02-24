# Sospechosos y Archivos Huérfanos

Las "páginas huérfanas" se definen, en este punto, heurísticamente como **rutas que no son accesadas explícitamente desde el sistema de navegación global (`nav.ts`), TopBar o Sidebar.**

## Lista de Sospechosos

- **`src/app/eagle-eye/page.tsx`:** (Nombre exótico no rastreable en mapas visibles al usuario standard).
- **`src/app/analiticas/page.tsx` & `src/app/analytics/master/page.tsx`:** (Huérfanos por haber sido desplazados a `/rendimiento`).
- **Granja de Contenidos Marketing (`src/app/marketing/contents/*`):** `ebooks/`, `coupons/`, `courses/`, `automations/`. Son vistas muy atómicas de marketing sub-jerarquizadas no integradas de entrada en listados (podrían ser accesadas vía URLs profundas y no estar realmente huérfanas).
- **Ajustes Silenciosos (`src/app/settings/*`):** `notifications/`, `api-usage/`, `clowdbot/`. Usualmente estos se ligan al perfil de usuario local (`Avatar`), pero han de ser inspeccionados para confirmar si el botón realmente existe en el menú Dropdown del Front End.
- **Herramientas de IA y Extras Mkt (`src/app/marketing/*`):** `mvp-wizard/`, `ai-bridge/`, `clowdbot-lab/`, `product-brain/`. Podrían ser partes experimentales o inacabadas antes de convertirse en `agentes-ia/`.

---

## Protocolo de Comprobación y Depuración a Riesgo Cero (Paso B)

### 1. Hard-Search / Traceabilidad (Local)
Antes de declarar algo obsoleto, correremos un barrido por el directorio entero buscando imports crudos del literal en el DOM:
```bash
# Ejemplo buscando quién llama al eagle-eye
grep -ri '"/eagle-eye"' src/
```
Si el resultado es en blanco, pasamos a confirmación huérfana.

### 2. Cuarentena Suave (Soft Delete Mod)
Las mecánicas de carpetas del *App Router de Next.js* ignoran las rutas precedidas por un `_` o envueltas en `()`.
En vez de ejecutar `rm -rf src/app/eagle-eye`, moveremos la carpeta a `src/app/(deprecated)/eagle-eye`.
- **Qué logra esto:** El framework suelta las rutas del mapa de compilado, haciéndolas dar `404 Not Found`. El tamaño del bundle JS se limpia.
- **Factor Seguro:** Si nos hemos equivocado y un enlace profundo cae, no hay pérdida de código escrito; sencillamente quitamos el paraguas `(deprecated)` de vuelta por encima de la carpeta para restablecer la paz instantáneamente.

### 3. Analytics Hit Tracking (Producción)
En caso de que el sistema posea Vercel Web Analytics instalado, se aconseja consultar la pestaña de "Paths" de los últimos 30 días. Si un path huérfano recibe 0 peticiones legítimas durante ese periodo, califica inmediatamente para el *Soft Delete*.
