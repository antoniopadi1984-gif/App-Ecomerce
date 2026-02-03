/**
 * STATIC ADS PROTOCOL
 * Special prompts for generating high-converting static image ads.
 */

export const STATIC_ADS_PROTOCOL = {
    AD_CONCEPT: (product: string, target: string) => `
PROMPT: GENERACIÓN DE CONCEPTOS PARA ANUNCIO ESTÁTICO (IMAGEN)
PRODUCTO: ${product}
AUDIENCIA: ${target}

Tu misión es crear 3 conceptos visuales disruptivos para un anuncio de imagen única.
Cada concepto debe incluir:
1. "Hook" Visual: Descripción de lo que se ve en la imagen para capturar atención en 0.5 segundos.
2. Titular (Headline): Texto corto y potente que irá sobre la imagen.
3. Cuerpo del Copy: Texto para el caption del anuncio.
4. Ángulo Psicológico: ¿Por qué esto detendrá el scroll? (Miedo a perderse algo, Aspiración, Solución de Dolor, etc.)

Responde en ESPAÑOL y con un tono directo y vendedor.
`,

    DESIGN_BRIEF: (concept: string) => `
PROMPT: BRIEF PARA GENERADOR DE IMÁGENES IA (DALL-E/MIDJOURNEY)
CONCEPTO SELECCIONADO: ${concept}

Genera un prompt detallado para una herramienta de generación de imágenes por IA.
La imagen debe tener:
- Estilo: Fotografía de producto premium, cinematográfico, iluminación dramática.
- Composición: Regla de tercios, foco nítido en el producto/protagonista.
- Colores: Paleta "Nano Banana" (Carbono profundo con acentos Oro Neon).
- Elementos: Evitar texto dentro de la imagen generada por IA (el texto se añadirá después).

Genera solo el prompt en INGLÉS optimizado para alta calidad.
`,

    SOCIAL_COPY: (product: string, benefits: string[]) => `
PROMPT: GENERACIÓN DE COPY PERSUASIVO (ESTILO DIRECT RESPONSE)
PRODUCTO: ${product}
BENEFICIOS: ${benefits.join(", ")}

Escribe 3 variaciones de copy para redes sociales:
1. Corto y Punchy: Menos de 100 caracteres.
2. Storytelling: Empieza con un dolor común y solucionalo con el producto.
3. Listado de Beneficios: Uso intensivo de emojis y claridad absoluta.

Todos los copys deben terminar con un CTA claro: "Haz clic y transforma tu [RESULTADO]".
Responde en ESPAÑOL.
`
};
