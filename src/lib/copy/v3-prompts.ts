export const CLAUDE_PROMPTS_V3 = {
 // PROMPT #4: Angle Generation
 // Input: { avatar, languageData }
 ANGLE_GENERATION: `
 Actúa como un Copy Chief de Respuesta Directa y Psicólogo de Ventas.
 MISION: Generar 5-7 Ángulos de Venta potentes y detectar las "Blocking Beliefs" que impiden la compra.

 AVATAR: {{avatarJson}}
 DICCIONARIO: {{languageJson}}

 TAREA:
 1. Basado en el dolor y deseo del avatar, desarrolla ángulos que corten el ruido.
 2. Identifica las creencias limitantes (Blocking Beliefs) que cada ángulo debe destruir.

 REQUERIMIENTO DE SALIDA (JSON):
 {
 "angles": [
 {
 "id": "angle_1",
 "name": "Nombre del ángulo",
 "hook": "El gancho principal",
 "blocking_belief": "Lo que creen que les impide comprar",
 "destruction_strategy": "Cómo vamos a demostrar que esa creencia es falsa"
 }
 ]
 }
 `,

 // PROMPT #5: Sales Letter (Long Form)
 // Input: { avatar, language, angle, framework: 'sales-letter' }
 SALES_LETTER: `
 Actúa como un Copywriter de Respuesta Directa nivel Eugene Schwartz (Breakthrough Advertising).
 MISION: Escribir una Carta de Ventas de alto impacto (1,200 - 1,600 palabras).

 ANGULO: {{angle}}
 AVATAR: {{avatar}}
 LENGUAJE: {{language}}

 ESTRUCTURA OBLIGATORIA (8 SECCIONES):
 1. El Gancho (The Hook): Interrupción de patrón agresiva.
 2. La Agitación del Dolor: Usa el VOC literal (3 AM).
 3. La Revelación del Mecanismo: Por qué todo lo anterior falló y por qué ESTO funciona.
 4. El Vínculo con el Avatar: "Yo era como tú" o "He ayudado a miles como tú".
 5. Los Beneficios Futuros: Visualización del "Yo Ideal".
 6. La Oferta Irresistible: Presentación de la solución.
 7. Destrucción de Objeciones: Matar las Blocking Beliefs una a una.
 8. El Cierre (Call to Action): Urgencia y escasez real.

 REQUERIMIENTO: Escribe en un tono crudo, real, empático y extremadamente persuasivo. Usa el Diccionario de Pertenencia del avatar.
 `,

 // STORY LEAD (Medium Form)
 STORY_LEAD: `
 MISION: Crear un "Story Lead" persuasivo para audiencias No-Conscientes (Unaware).
 Enfoque: Una historia personal o de un tercero que personifique el problema sin vender directamente el producto hasta el final.
 `,

 // PROMPT #6: 6 Frameworks (Short Form)
 FRAMEWORKS: {
 CREDIBILITY_THROUGH_EXPERIENCE: "Enfoque en autoridad y años de prueba/error.",
 RESEARCH_REVEAL: "Enfoque en un nuevo descubrimiento o dato impactante.",
 SHOCKING_CONFESSION: "Enfoque en algo que nadie se atreve a decir en el nicho.",
 SITUATIONAL_PROBLEM_SOLVER: "Enfoque en un momento específico de crisis y su solución.",
 DIAGNOSTIC_CHECKLIST: "Enfoque en '¿tienes estos síntomas?'.",
 DO_YOU_EVER_FEEL: "Enfoque en empatía pura y validación emocional."
 }
};
