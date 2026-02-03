
export const MASTER_PROTOCOL_PROMPTS = {
    MASS_DESIRES: (product: string, country: string, competitors: string[]) => `
PROMPT #1: DESCUBRIMIENTO DE DESEOS DE MASA DESDE INVESTIGACIÓN DE MERCADO
Estoy investigando los deseos de masa que existen en el mercado para productos en el espacio de [CATEGORÍA DEL PRODUCTO] en ${country || "Global"}.
Mi producto es: ${product}
Para referencia, aquí está mi producto/competidores: ${competitors.join(", ")}

TU MISIÓN: Realizar una investigación de mercado sistemática para descubrir qué deseos YA EXISTEN en este mercado. No hagas suposiciones. Deja que los datos revelen los deseos.

REQUISITO CRÍTICO: Para CADA uno de los 10 deseos superficiales que identifiques (5 Primarios + 5 Secundarios/No explotados), DEBES encontrar e informar EXACTAMENTE 3 impulsores emocionales que lo alimentan.

DESEOS SUPERFICIALES PRIMARIOS:
Encuentra 5 Deseos Superficiales Primarios.
Formato: "Quiero [resultado que sucede AL USAR el producto]"

DESEOS DE MERCADO SECUNDARIOS/NO EXPLOTADOS:
Encuentra 5 Deseos Superficiales Secundarios/No explotados.

PASO 1: DESCUBRIR DESEOS SUPERFICIALES PRIMARIOS
PASO 2: DESCUBRIR DESEOS DE MERCADO SECUNDARIOS/NO EXPLOTADOS
PASO 3: DESCUBRIR IMPULSORES EMOCIONALES
PASO 4: MAPEAR IMPULSORES EMOCIONALES A DESEOS SUPERFICIALES
PASO 5: CLASIFICACIÓN CUANTITATIVA
PASO 6: IDENTIFICAR CLÚSTERS DE DESEO
PASO 7: ENTREGABLE FINAL (REPORTE MARKDOWN EN ESPAÑOL)

Proporciona un reporte completo con:
1. Resumen Ejecutivo
2. Clasificación de Deseos Superficiales
3. Clasificación de Impulsores Emocionales
4. Mapeo de Emoción a Superficie
4.5 Declaraciones de Segmentación de Avatar
5. Segmentos Naturales Basados en el Deseo
6. Métricas de Calidad de la Investigación

IMPORTANTE: TODO EL REPORTE DEBE ESTAR EN ESPAÑOL.
    `,

    MACRO_AVATARS: (massDesireReport: string) => `
PROMPT #2: CREACIÓN DE MACRO-AVATARES
He completado la investigación de deseos de masa.
AQUÍ ESTÁN LOS DATOS DE LA INVESTIGACIÓN:
${massDesireReport}

TU MISIÓN:
Crear 5 Macro-Avatares - uno para cada uno de los 5 deseos superficiales principales identificados en el Prompt #1.
CRÍTICO: Debes realizar NUEVA investigación a través de TODOS los tipos de fuentes para encontrar las experiencias, comportamientos, creencias y patrones de conciencia para cada deseo.

PARA CADA UNO DE LOS 5 DESEOS, INVESTIGA:
PASO 1: EXPERIENCIAS DETONANTES ("¿Qué pasó que les hizo querer esto?")
PASO 2: COMPORTAMIENTOS ACTUALES ("¿Qué están haciendo ahora?")
PASO 3: CREENCIAS CENTRALES ("¿Qué creen?")
PASO 4: NIVEL DE CONCIENCIA ("¿Qué saben?")

CREA LA SALIDA FINAL EN DOS SECCIONES (EN ESPAÑOL):
SECCIÓN 1: HALLAZGOS DETALLADOS DE LA INVESTIGACIÓN
SECCIÓN 2: REFERENCIA RÁPIDA DE MACRO-AVATARES (Perfiles accionables para creación de anuncios)

IMPORTANTE: RESPONDE SIEMPRE EN ESPAÑOL.
    `,

    LANGUAGE_EXTRACTION: (macroAvatarReport: string) => `
PROMPT #2.1: EXTRACCIÓN DE LENGUAJE DE MACRO-AVATARES
He identificado 5 macro-avatares.
AQUÍ ESTÁN LOS DATOS DEL AVATAR:
${macroAvatarReport}

TU MISIÓN:
Para CADA uno de los 5 macro-avatares, extrae su LENGUAJE EXACTO en un formato conciso y usable.
Objetivo: 3-4 páginas por avatar. No más.

FORMATO DE SALIDA (POR AVATAR, EN ESPAÑOL):
### 1. LENGUAJE DEL PROBLEMA
### 2. LENGUAJE DE LA EXPERIENCIA DIARIA
### 3. LENGUAJE DE CREENCIAS
### 4. LENGUAJE DEL ESTADO PSICOLÓGICO/MENTAL
### 5. EXPRESIÓN EMOCIONAL
### 6. LENGUAJE DE SOLUCIONES FALLIDAS
### 7. LENGUAJE DE IDENTIDAD Y RELACIONES
### 8. LENGUAJE DE DESCUBRIMIENTO/APRENDIZAJE
### 9. LENGUAJE DE TRANSFORMACIÓN
### 10. LENGUAJE DE REFERENCIA DE AUTORIDAD
### 11. LENGUAJE DE LÍNEA DE TIEMPO/ARREPENTIMIENTO
### 12. PALABRAS DE ALTA FRECUENCIA
### 13. PALABRAS TABÚ (NUNCA USAR)

IMPORTANTE: TODO EL CONTENIDO DEBE ESTAR EN ESPAÑOL.
    `,

    AD_COPY_GENERATOR: (avatarData: string, languageBank: string, productInfo: string) => `
PROMPT #3: GENERADOR DE COPY DE ANUNCIOS PARA MACRO-AVATARES
Estoy generando copy de anuncios para mi marca.
Vamos a escribir para [INSERTAR # DE MACRO AVATAR DESEADO AQUÍ]

INFORMACIÓN DEL PRODUCTO:
${productInfo}

DATOS DEL AVATAR:
${avatarData}

BANCO DE LENGUAJE:
${languageBank}

Genera cartas de venta en formato de historia siguiendo la estructura exacta de 8 secciones.
8 SECCIONES:
1. Hook (Fase 1B)
2. Identificación Inmediata (75-150 palabras)
3. Amplificación (150-250 palabras)
4. Descubrimiento del Producto (150-250 palabras)
5. Introducción del UMP (100-150 palabras)
6. Introducción del UMS (100-150 palabras)
7. Transformación (125-200 palabras)
8. Llamado a la Acción (150-200 palabras)

FLUJO DE EJECUCIÓN:
Fase 1A: Revisar resumen de segmentación
Fase 1C: Generar y seleccionar mecanismos + escenario de descubrimiento
Fase 1B: Generar y seleccionar hook
Fase 2: Generar y aprobar lead (Secciones 2-3)
Fase 3: Recibir copy completo (Secciones 4-8)

IMPORTANTE: EL COPY DEBE ESTAR COMPLETAMENTE EN ESPAÑOL.
    `,

    ANGLE_GENERATION: (avatarProfile: string, productInfo: string) => `
PROMPT #4: GENERACIÓN DE ÁNGULOS
Mi categoría de producto es: [PRODUCTO / CATEGORÍA DE PRODUCTO]
He identificado mi Macro-Avatar ganador y necesito generar ángulos de marketing.
PERFIL DEL AVATAR:
${avatarProfile}

TU MISIÓN:
Generar 5-7 ángulos para este avatar.
Cada ángulo debe:
- Estar escrito en ESPAÑOL SENCILLO
- Estar basado en creencias reales
- Introducir NUEVA información
- Crear urgencia
- Ser simple (comprensible para un CI de 90)

PASO 1: IDENTIFICAR CREENCIAS BLOQUEANTES
PASO 2: ELEGIR LA CREENCIA BLOQUEANTE MÁS FUERTE
PASO 3: GENERAR ÁNGULOS
PASO 4: CLASIFICAR LOS ÁNGULOS (EN ESPAÑOL)

IMPORTANTE: RESPONDE SIEMPRE EN ESPAÑOL.
    `,

    ANGLE_COPY_WRITER: (angle: string, avatarData: string, languageBank: string, productInfo: string) => `
PROMPT #5: ESCRITURA DE COPY PARA ÁNGULOS
Estoy generando copy de anuncios para mi marca.
Vamos a escribir para este ángulo: ${angle}

INFORMACIÓN DEL PRODUCTO:
${productInfo}

DATOS DEL AVATAR:
${avatarData}

BANCO DE LENGUAJE:
${languageBank}

Genera cartas de venta en formato de historia siguiendo la estructura exacta de 8 secciones del ejemplo anotado.
8 SECCIONES:
1. Hook (Fase 1B)
2. Identificación Inmediata
3. Amplificación
4. Descubrimiento del Producto
5. Introducción del UMP
6. Introducción del UMS
7. Transformación
8. Llamado a la Acción

FLUJO DE EJECUCIÓN:
Fase 1A: Revisar resumen de segmentación
Fase 1C: Generar y seleccionar mecanismos + escenario de descubrimiento
Fase 1B: Generar y seleccionar hook
Fase 2: Generar y aprobar lead
Fase 3: Recibir copy completo

IMPORTANTE: EL COPY DEBE ESTAR COMPLETAMENTE EN ESPAÑOL.
    `,

    STORY_LEAD_GENERATOR: (avatarData: string, productInfo: string) => `
PROMPT: COPY DE ANUNCIO CON LEAD DE HISTORIA
LEER PRIMERO: Al entrar en este prompt, se requerirá proporcionar la información de tu Producto y Avatar.

INFORMACIÓN DEL PRODUCTO REQUERIDA:
${productInfo}

INFORMACIÓN DEL AVATAR REQUERIDA:
${avatarData}

FLUJO DE EJECUCIÓN:
FASE 1: Generar 10-15 Hooks → Tú seleccionas uno
FASE 2: Generar el Lead (300-400 palabras) → Tú apruebas
FASE 3: Generar Copy Completo (900-1,200 palabras)

FASE 1: GENERACIÓN DE HOOK Y MECANISMO
PASO 1A: Generar 10-15 opciones de Hook
Crea hooks usando PATRONES (Miedo, Curiosidad, Transformación, Identificación, Mecanismo, Garantía, Pregunta, Consejo, Prueba Social, Comando).
PASO 1B: Generar Par de Mecanismos (UMP/UMS)
Basado en el hook, avatar y producto seleccionados.

FASE 2: GENERAR EL LEAD (300-400 palabras)
Estructura:
- Hook como titular
- Establecer conflicto emocional inmediatamente
- Introducir protagonista (relatable)
- Mostrar estado de dolor actual
- Crear identificación
- Referencia a soluciones fallidas
- Terminar con sensación de estar estancado
- SIN mención del producto aún

FASE 3: GENERAR COPY COMPLETO (900-1,200 palabras)
Sección 1: Intentos Fallidos y Escalamiento
Sección 2: Descubrimiento (Circunstancia de vida, Rec. de pares, Prueba observable)
Sección 3: Revelación del Mecanismo (UMP/UMS)
Sección 4: Prueba del Producto
Sección 5: Transformación (Enfoque emocional)
Sección 6: Cierre y CTA

IMPORTANTE: TODO EL CONTENIDO DEBE ESTAR EN ESPAÑOL.
    `,

    CREDIBILITY_AUTHORITY_FRAMEWORK: (avatarData: string, languageBank: string, productInfo: string) => `
PROMPT: FRAMEWORK "CREDIBILIDAD A TRAVÉS DE LA EXPERIENCIA" (COPY DE FIGURA DE AUTORIDAD)
ENTRADAS REQUERIDAS:
INFORMACIÓN DEL PRODUCTO:
${productInfo}

DATOS DEL AVATAR:
${avatarData}

BANCO DE LENGUAJE:
${languageBank}

QUÉ HACE ESTE FRAMEWORK:
Genera copy de anuncios de formato corto y escaneable (400-600 palabras) usando el framework "Credibilidad a través de la Experiencia".
Construye autoridad a través de la experiencia vivida, no credenciales profesionales.

FLUJO DE EJECUCIÓN:
FASE 1: SELECCIÓN DE PUNTO DE DOLOR
Identifica 3-7 puntos de dolor con intensidad emocional. El usuario selecciona uno.

FASE 2: EXTRACCIÓN DE LENGUAJE DEL PUNTO DE DOLOR
Extrae frases exactas para el punto de dolor seleccionado.
Identifica opciones de Hook de Autoridad (Experiencia, Supervivencia, Viaje).

FASE 2B: ESTRATEGIA DE EMOJIS
Recomienda emojis contextualmente apropiados.

FASE 3: GENERACIÓN DE COPY
Estructura:
Sección 1: Introducción de Autoridad
Sección 2: La Lista (Lista numerada de beneficios/razones)
Sección 3: La Historia de Fondo (Soluciones fallidas)
Sección 4: Introducción del Producto
Sección 5: Cómo Funciona
Sección 6: Prueba Social + Resolución Emocional + CTA

REGLAS CRÍTICAS DE ESCRITURA:
1. EL LENGUAJE DEL AVATAR LO ES TODO (Las primeras 3-5 frases deben ser frases exactas)
2. ESTRUCTURA DE ORACIONES (Promedio de 8-12 palabras)
3. FORMATO (Saltos de línea cada 1-2 oraciones)
4. LA LISTA NUMERADA (Números con emojis, títulos en negrita)
5. SIN CREDENCIALES PROFESIONALES (Solo experiencia vivida)
6. TONO NATURAL
7. RESOLUCIÓN DE DESEO EMOCIONAL (En la Sección 6)

IMPORTANTE: ESCRIBE TODO EL COPY EN ESPAÑOL.
    `,

    RESEARCH_REVEAL_FRAMEWORK: (avatarData: string, languageBank: string, productInfo: string) => `
PROMPT: FRAMEWORK "LA REVELACIÓN DE INVESTIGACIÓN" (COPY DE NOTICIA DE ÚLTIMO MOMENTO)
ENTRADAS REQUERIDAS:
INFORMACIÓN DEL PRODUCTO:
${productInfo}

DATOS DEL AVATAR:
${avatarData}

BANCO DE LENGUAJE:
${languageBank}

QUÉ HACE ESTE FRAMEWORK:
Genera copy de anuncios de formato corto estilo "noticia de último momento" (400-500 palabras) usando el framework "La Revelación de Investigación".
Utiliza investigaciones, estadísticas o estudios para crear credibilidad e interrupción de patrón.

FLUJO DE EJECUCIÓN:
FASE 1: SELECCIÓN DE PUNTO DE DOLOR
FASE 2: BÚSQUEDA DE INVESTIGACIÓN Y ESTADÍSTICAS (Usa investigaciones/estadísticas reales)
FASE 2B: GENERACIÓN DE HOOK (Avance de la investigación)
PASO 3: EXTRACCIÓN DE LENGUAJE DEL PUNTO DE DOLOR
PASO 4: ESTRATEGIA DE EMOJIS (12-18 emojis, muchos puntos)
PASO 5: GENERACIÓN DE COPY

ESTRUCTURA:
Sección 0: Hook (Curiosidad)
Sección 1: Revelación de Investigación (Estadística + Fuente)
Sección 2: Interrupción de Patrón ("Pero aquí está el detalle")
Sección 3: Explicación del Mecanismo
Sección 4: Consecuencias Negativas (puntos con ❌)
Sección 5: Transición a la Solución ("Por suerte...")
Sección 6: Introducción del Producto
Sección 7: Cómo Funciona
Sección 8: Resultados Positivos (puntos con ✅)
Sección 9: Resolución de Deseo Emocional + CTA

REGLAS CRÍTICAS DE ESCRITURA:
1. CREDIBILIDAD DE LA INVESTIGACIÓN (Debe ser real)
2. INTEGRACIÓN DEL LENGUAJE DEL AVATAR
3. ESTRUCTURA DE ORACIONES (Impactantes, 8-12 palabras)
4. FORMATO (Muchos saltos de línea, puntos ❌/✅)
5. INTERRUPCIÓN DE PATRÓN ("Pero aquí está el detalle")
6. LA TRANSICIÓN "POR SUERTE"
7. CONVERSACIONAL PERO CREÍBLE
8. RESOLUCIÓN DE DESEO EMOCIONAL (Antes del CTA)

IMPORTANTE: RESPONDE SIEMPRE EN ESPAÑOL.
    `,

    SHOCKING_CONFESSION_FRAMEWORK: (avatarData: string, languageBank: string, productInfo: string) => `
PROMPT: FRAMEWORK "LA CONFESIÓN IMPACTANTE" (COPY DE INTERRUPCIÓN DE PATRÓN)
ENTRADAS REQUERIDAS:
INFORMACIÓN DEL PRODUCTO:
${productInfo}

DATOS DEL AVATAR:
${avatarData}

BANCO DE LENGUAJE:
${languageBank}

QUÉ HACE ESTE FRAMEWORK:
Genera copy de anuncios de formato corto (450-550 palabras) usando el framework "La Confesión Impactante".
Abre con una declaración controversial/impactante que crea una interrupción de patrón.

FLUJO DE EJECUCIÓN:
FASE 1: SELECCIÓN DE PUNTO DE DOLOR
FASE 2: GENERACIÓN DE CONFESIÓN (8 opciones)
FASE 3: EXTRACCIÓN DE LENGUAJE DEL PUNTO DE DOLOR
FASE 4: ESTRATEGIA DE EMOJIS
FASE 5: GENERACIÓN DE COPY

ESTRUCTURA:
Sección 0: Hook (Curiosidad)
Sección 1: Confesión/Declaración Impactante (Sin emojis)
Sección 2: Reconocer Reacción (Detalles sensoriales)
Sección 3: Validación ("¿Y honestamente? Lo entiendo.")
Sección 4: La Lista (Beneficios, numerada con emojis)
Sección 5: Transición a la Historia de Fondo
Sección 6: Historia de Fondo (Soluciones fallidas)
Sección 7: Introducción del Producto
Sección 8: Cómo Funciona
Sección 9: Prueba Personal
Sección 10: Resolución de Deseo Emocional + CTA

REGLAS CRÍTICAS DE ESCRITURA:
1. EL LENGUAJE DEL AVATAR LO ES TODO
2. ESTRUCTURA DE ORACIONES (Promedio de 8-12 palabras)
3. FORMATO (Saltos de línea cada 1-2 oraciones)
4. LA LISTA NUMERADA (Máximo 2-3 oraciones)
5. ESTRUCTURA DE INTERRUPCIÓN DE PATRÓN (Impacto -> Reconocer -> Validar)
6. TONO CONVERSACIONAL (Más casual que el Research Reveal)
7. RESOLUCIÓN DE DESEO EMOCIONAL (Antes del CTA)

IMPORTANTE: ESCRIBE TODO EL COPY EN ESPAÑOL.
    `,

    SITUATIONAL_PROBLEM_SOLVER_FRAMEWORK: (avatarData: string, languageBank: string, productInfo: string) => `
PROMPT: FRAMEWORK "EL SOLUCIONADOR DE PROBLEMAS SITUACIONAL" (COPY DE CASO DE USO)
ENTRADAS REQUERIDAS:
INFORMACIÓN DEL PRODUCTO:
${productInfo}

DATOS DEL AVATAR:
${avatarData}

BANCO DE LENGUAJE:
${languageBank}

QUÉ HACE ESTE FRAMEWORK:
Genera copy de anuncios de formato corto (350-450 palabras) usando el framework "El Solucionador de Problemas Situacional".
Abre con una situación/caso de uso hiper-específico, luego muestra cómo el producto resuelve el problema en ese escenario exacto.

FLUJO DE EJECUCIÓN:
FASE 1: SELECCIÓN DE PUNTO DE DOLOR
FASE 2: GENERACIÓN DE SITUACIÓN (8 opciones)
FASE 3: EXTRACCIÓN DE LENGUAJE DEL PUNTO DE DOLOR
FASE 4: ESTRATEGIA DE EMOJIS
FASE 5: GENERACIÓN DE COPY

ESTRUCTURA:
Sección 0: Hook Situacional (Escenario específico)
Sección 1: Validación ("En serio, esto cambia las reglas del juego")
Sección 2: Introducción del Producto (TEMPRANO)
Sección 3: Transición
Sección 4: Problema de la Situación (Lenguaje del avatar)
Sección 5: Explicación del Mecanismo
Sección 6: Beneficios Visuales (puntos con ✅)
Sección 7: Contraste (Cuando haces X vs cuando no)
Sección 8: "Así que la próxima vez..." + Resolución Emocional + CTA

REGLAS CRÍTICAS DE ESCRITURA:
1. SITUACIÓN HIPER-ESPECÍFICA (Detalles vívidos)
2. EL LENGUAJE DEL AVATAR LO ES TODO
3. ESTRUCTURA DE ORACIONES (Impactantes, 8-12 palabras)
4. FORMATO VISUAL (Uso intensivo de ✅)
5. NOMBRE DEL PRODUCTO TEMPRANO (Sección 2)
6. ESTRUCTURA DE CONTRASTE (Antes/Después)
7. RESOLUCIÓN DE DESEO EMOCIONAL (Antes del CTA)

IMPORTANTE: RESPONDE SIEMPRE EN ESPAÑOL.
    `,

    DIAGNOSTIC_CHECKLIST_FRAMEWORK: (avatarData: string, languageBank: string, productInfo: string) => `
PROMPT: FRAMEWORK "LA LISTA DE DIAGNÓSTICO" (COPY DE AUTO-EVALUACIÓN)
ENTRADAS REQUERIDAS:
INFORMACIÓN DEL PRODUCTO:
${productInfo}

DATOS DEL AVATAR:
${avatarData}

BANCO DE LENGUAJE:
${languageBank}

QUÉ HACE ESTE FRAMEWORK:
Genera copy de anuncios de formato medio (500-700 palabras) usando el framework "La Lista de Diagnóstico".
Abre con signos/síntomas numerados que permiten al lector autodiagnosticarse, luego revela la causa raíz y la solución.

FLUJO DE EJECUCIÓN:
FASE 1: SELECCIÓN DE PUNTO DE DOLOR
FASE 2: GENERACIÓN DE SIGNOS/SÍNTOMAS (5-7 signos identificables)
FASE 3: EXTRACCIÓN DE LENGUAJE DEL PUNTO DE DOLOR
FASE 4: ESTRATEGIA DE EMOJIS
FASE 5: GENERACIÓN DE COPY

ESTRUCTURA:
Sección 0: Hook con indicación de Autodiagnóstico
Sección 1: Signos/Síntomas Numerados (Mini-historias)
Sección 2: Transición ("Si tienes aunque sea UNO...")
Sección 3: Revelación de la Causa Raíz (El momento "Aha")
Sección 4: Explicación del Mecanismo
Sección 5: Consecuencias (puntos con ❌)
Sección 6: Transición a la Solución
Sección 7: Introducción del Producto
Sección 8: Cómo Funciona
Sección 9: Prueba Social (fragmentos ⭐)
Sección 10: Resolución de Deseo Emocional + CTA

REGLAS CRÍTICAS DE ESCRITURA:
1. HOOK DE AUTODIAGNÓSTICO ("¿Tienes estos signos?")
2. MINI-HISTORIAS PARA LOS SIGNOS (No solo elementos de lista)
3. EL LENGUAJE DEL AVATAR LO ES TODO
4. REVELACIÓN DE CAUSA RAÍZ (Conectar signos con la causa)
5. FRAGMENTOS DE PRUEBA SOCIAL (Cortos e impactantes)
6. TONO EDUCATIVO PERO ACCESIBLE
7. RESOLUCIÓN DE DESEO EMOCIONAL (Antes del CTA)

IMPORTANTE: ESCRIBE TODO EL COPY EN ESPAÑOL.
    `,

    DO_YOU_EVER_FEEL_FRAMEWORK: (avatarData: string, languageBank: string, productInfo: string) => `
PROMPT: FRAMEWORK "¿ALGUNA VEZ TE HAS SENTIDO...?" (COPY DE LEAD DE RELATABILIDAD)
ENTRADAS REQUERIDAS:
INFORMACIÓN DEL PRODUCTO:
${productInfo}

DATOS DEL AVATAR:
${avatarData}

BANCO DE LENGUAJE:
${languageBank}

QUÉ HACE ESTE FRAMEWORK:
Genera copy de anuncios de formato medio (450-550 palabras) usando el framework "¿Alguna vez te has sentido...?".
Abre con una pregunta de empatía que crea resonancia emocional inmediata, luego revela la causa oculta y la solución.

FLUJO DE EJECUCIÓN:
FASE 1: SELECCIÓN DE PUNTO DE DOLOR
FASE 2: GENERACIÓN DE PREGUNTAS DE EMPATÍA (8 opciones)
FASE 3: EXTRACCIÓN DE LENGUAJE DEL PUNTO DE DOLOR
FASE 4: ESTRATEGIA DE EMOJIS
FASE 5: GENERACIÓN DE COPY

ESTRUCTURA:
Sección 0: Hook de Pregunta de Empatía Relatable ("¿Alguna vez te has sentido...?")
Sección 1: Lista de Síntomas/Frustraciones (3-4 elementos)
Sección 2: Transición ("No es solo mala suerte")
Sección 3: Revelación de la Causa Real (La Intuición)
Sección 4: Explicación del Mecanismo
Sección 5: Transición a la Solución
Sección 6: Introducción del Producto
Sección 7: Cómo Funciona
Sección 8: Beneficios (puntos ✅, enfatizar alivio)
Sección 9: Prueba Social (Enfocada en la transformación)
Sección 10: Resolución de Deseo Emocional + CTA

REGLAS CRÍTICAS DE ESCRITURA:
1. HOOK DE PREGUNTA DE EMPATÍA (Crea el reconocimiento "ese soy yo")
2. EL LENGUAJE DEL AVATAR LO ES TODO
3. LA REVELACIÓN DE LA CAUSA SE SIENTE COMO UNA INTUICIÓN ("Esto es lo que realmente está pasando")
4. LOS BENEFICIOS SE ENFOCAN EN EL ALIVIO
5. LA PRUEBA SOCIAL MUESTRA LA TRANSFORMACIÓN
6. TONO CÁLIDO Y CONVERSACIONAL
7. RESOLUCIÓN DE DESEO EMOCIONAL (Antes del CTA)

IMPORTANTE: RESPONDE SIEMPRE EN ESPAÑOL.
    `,

    MARKET_AWARENESS: (niche: string, product: string, geography: string, details?: string) => `
PROMPT #1: EVALUACIÓN DE NIVEL DE CONCIENCIA DE MERCADO (EUGENE SCHWARTZ)
Quiero tu ayuda para evaluar el nivel de Conciencia de Mercado (Market Awareness)
para un producto en el espacio de: ${niche}. 
El producto específico es: ${product}.

Me gustaría que profundizaras para ayudarme a entender el nivel actual de conciencia del
mercado para este producto en: ${geography}.

${details ? `Detalles adicionales: ${details}` : ""}

Para hacer esto, nos basaremos en los niveles clásicos de conciencia de Eugene Schwartz:

1. No consciente (Unaware): Los prospectos ni siquiera son conscientes de que existe un problema o necesidad.
2. Consciente del problema (Problem Aware): Los prospectos reconocen que tienen un problema o necesidad, pero no conocen las posibles soluciones.
3. Consciente de la solución (Solution Aware): Los prospectos saben que existen soluciones para su problema, pero aún no conocen tu solución específica.
4. Consciente del producto (Product Aware): Los prospectos conocen tu solución, tu producto o servicio, y están evaluando sus características y beneficios.
5. Muy consciente (Most Aware): Los prospectos están altamente informados sobre tu solución, sus beneficios, y es probable que tomen una decisión de compra pronto.

REGLA OPERATIVA: No consideremos "Consciente del producto" ni "Muy consciente" como conciencia de nuestro producto y marca específicos. En su lugar, considerémoslos como conciencia sobre productos y marcas similares o casi idénticas.

Realiza esta evaluación utilizando conversaciones en redes sociales, artículos, blogs, contenido de influencers, tendencias de búsqueda y datos de ventas.

ENTREGABLES:
1. Visión general del TAM estimado (Total Addressable Market).
2. Estimación aproximada del porcentaje del TAM en cada categoría de conciencia.
3. SELECCIÓN FINAL del nivel de Conciencia donde se encuentra la mayoría.

IMPORTANTE: TODO EL REPORTE DEBE ESTAR EN ESPAÑOL.
    `
};
