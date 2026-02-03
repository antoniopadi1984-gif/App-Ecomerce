
import { askGemini } from "./ai";

export type ContentContext = 'AD_VIDEO' | 'AD_STATIC' | 'LANDING_PAGE' | 'ADVERTORIAL' | 'LISTICLE';

export const COMPLIANCE_RULES = {
    SAFE_MODE_ADS: {
        prohibited: [
            "garantizado", "curación total", "ganar dinero rápido", "antes/después exagerado",
            "el mejor del mundo", "sin esfuerzo", "100% eficaz", "milagroso"
        ],
        instructions: "Evita reclamos de salud no probados, promesas de resultados financieros irreales y lenguaje agresivo que pueda causar el bloqueo de la cuenta publicitaria de Meta."
    },
    AGGRESSIVE_LANDING: {
        instructions: "Usa un copy persuasivo, directo y agresivo enfocado a la conversión. Usa mecanismos psicológicos de escasez, urgencia y beneficios extremos. No te preocupes por el compliance de Meta aquí, enfócate en la 'Big Idea' y el deseo del cliente."
    }
};

/**
 * Enhanced Copy Hub Protocol
 * Orchestrates generation based on compliance mode.
 */
export async function generateMasterCopy(params: {
    productName: string,
    context: ContentContext,
    isSafeMode: boolean,
    brandVoice?: string,
    researchData?: any
}) {
    const { productName, context, isSafeMode, brandVoice, researchData } = params;

    let systemPrompt = `Actúa como un Copywriter de Respuesta Directa de Clase Mundial especializado en eCommerce.`;

    if (brandVoice) {
        systemPrompt += `\nVOZ DE MARCA: ${brandVoice}`;
    }

    if (isSafeMode && (context === 'AD_VIDEO' || context === 'AD_STATIC')) {
        systemPrompt += `\nMODO SEGURO ACTIVADO: ${COMPLIANCE_RULES.SAFE_MODE_ADS.instructions}`;
    } else if (!isSafeMode || context === 'LANDING_PAGE' || context === 'ADVERTORIAL') {
        systemPrompt += `\nMODO AGRESIVO ACTIVADO: ${COMPLIANCE_RULES.AGGRESSIVE_LANDING.instructions}`;
    }

    const userPrompt = `
        PRODUCTO: ${productName}
        FORMATO: ${context}
        RESEARCH DATA: ${JSON.stringify(researchData || {})}
        
        Tu tarea es generar el copy final. Si es una Landing Page o Advertorial, incluye la estructura de secciones [SECTION_NAME].
        Asegúrate de incluir Hooks potentes y CTAs claros.
        Detecta similitud y evita copiar literalmente a la competencia, innova en el ángulo.
    `;

    const response = await askGemini(userPrompt, systemPrompt);
    return response.text;
}

/**
 * Nomenclature Engine: Shorthand system for creative naming.
 */
export function formatCreativeName(params: {
    product: string,
    concept: string,
    version: string,
    language: string,
    template?: string
}) {
    const { product, concept, version, language, template } = params;

    // Default Shorthand logic
    const sh = (s: string) => s.substring(0, 3).toUpperCase();

    let name = template || "[PROD]_[CONC]_[VER]_[LANG]";

    name = name.replace("[PROD]", sh(product))
        .replace("[CONC]", sh(concept))
        .replace("[VER]", version)
        .replace("[LANG]", language.toUpperCase());

    return name;
}
