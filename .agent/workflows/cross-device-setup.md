---
description: Cómo configurar y sincronizar el proyecto entre diferentes ordenadores
---

# Guía de Sincronización Multi-Dispositivo

Para trabajar en diferentes ordenadores manteniendo el progreso de Antigravity y la configuración del proyecto, sigue estos pasos:

## 1. Sincronización del Proyecto (Opciones)

### Opción A: Usar Git/GitHub (Recomendado para programadores)
Como ya tienes Git instalado en tu Mac, esta es la opción más limpia.
1. Crea un repositorio privado en GitHub.
2. Sincroniza desde tu terminal:
   ```bash
   git add .
   git commit -m "Sincronización"
   git push origin main
   ```

### Opción B: Carpeta en la Nube (iCloud, Dropbox, Google Drive)
Si no quieres usar Git, simplemente mueve o copia la carpeta **"App Ecomerce"** a tu carpeta de iCloud o Dropbox.
- **Ventaja**: Se sincroniza solo.
- **Importante**: Asegúrate de que los archivos se hayan descargado completamente en el segundo ordenador antes de abrir Antigravity.

### Opción C: Pendrive o Disco Externo
Puedes copiar la carpeta directamente a un disco externo. 
- **Nota**: Al copiar, asegúrate de que se incluya la carpeta oculta `.antigravity` (puedes ver archivos ocultos con `Cmd + Shift + .` en el Finder).

## 2. Configuración del Entorno (NUEVO ORDENADOR)
Una vez clonado, debes preparar el sistema:
1. **Instalar dependencias de Node**:
   ```bash
   npm install
   ```
2. **Preparar el Motor Python**:
   Ejecuta el instalador que repara el entorno automáticamente:
   ```bash
   bash src/engine/install_engine.sh
   ```
3. **Variables de Entorno**:
   Copia tu archivo `.env` al nuevo ordenador (el archivo `.env` no se sube a GitHub por seguridad).

## 3. Sincronización de la "Memoria" (Antigravity Brain)
Para que el asistente recuerde lo que hemos hecho:
- Todos los planes y tareas se guardan en la carpeta `.antigravity/` en la raíz del proyecto.
- Al hacer `git push`, esta memoria se sincroniza.
- En el otro ordenador, Antigravity leerá automáticamente estos archivos para continuar donde lo dejamos.

## 4. Cómo "Entrar" al Proyecto en el nuevo ordenador

Para que Antigravity sepa que es el mismo proyecto y no empiece de cero:

1. **NO crees una carpeta nueva.**
2. **Abre la carpeta que has sincronizado** (la que bajaste de GitHub o la que tienes en iCloud/Dropbox).
3. En Antigravity, ve a **File > Open Folder...** y selecciona la carpeta raíz **"App Ecomerce"**.
4. **Magia**: Como dentro de esa carpeta está la carpeta oculta `.antigravity`, el asistente leerá tu historial, tus tareas pendientes y tus instrucciones personalizadas al instante.

## 5. Ejecución Segura
Recuerda siempre arrancar los servicios desde una terminal externa para evitar bloqueos:
```bash
npm run dev:all
```
