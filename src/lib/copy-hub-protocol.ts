
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
    researchData?: any,
    sophisticationLevel?: number,
    mechanism?: string,
    customPrompt?: string,
    competitorExamples?: string[]
}) {
    const {
        productName, context, isSafeMode, brandVoice, researchData,
        sophisticationLevel, mechanism, customPrompt, competitorExamples
    } = params;

    let systemPrompt = `Actúa como un Copywriter de Respuesta Directa de Clase Mundial especializado en eCommerce.`;

    if (brandVoice) {
        systemPrompt += `\nVOZ DE MARCA: ${brandVoice}`;
    }

    if (isSafeMode && (context === 'AD_VIDEO' || context === 'AD_STATIC')) {
        systemPrompt += `\nMODO SEGURO ACTIVADO: ${COMPLIANCE_RULES.SAFE_MODE_ADS.instructions}`;
    } else if (!isSafeMode || context === 'LANDING_PAGE' || context === 'ADVERTORIAL') {
        systemPrompt += `\nMODO AGRESIVO ACTIVADO: ${COMPLIANCE_RULES.AGGRESSIVE_LANDING.instructions}`;
    }

    // Import constants locally to avoid circular deps if any
    const { CLAUDE_PROMPTS_V3 } = require('./copy/copy-v3-prompts');
    const sophisticationDesc = sophisticationLevel ? (CLAUDE_PROMPTS_V3.SOPHISTICATION_LEVELS as any)[sophisticationLevel] : "General";

    const userPrompt = `
        PRODUCTO: ${productName}
        FORMATO: ${context}
        RESEARCH DATA: ${JSON.stringify(researchData || {})}
        SOFISTICACION DE MERCADO (EUGENE SCHWARTZ): ${sophisticationDesc}
        MECANISMO UNICO / BIG IDEA: ${mechanism || "No especificado - Dedúcelo del producto"}
        
        ${competitorExamples && competitorExamples.length > 0 ? `\nEJEMPLOS DE COMPETENCIA (Sigue este estilo o mejora sobre ello):\n${competitorExamples.join('\n')}` : ""}
        
        ${customPrompt ? `\nINSTRUCCIONES ADICIONALES DEL USUARIO (PRIORIDAD ALTA):\n${customPrompt}` : ""}

        Tu tarea es generar el copy final siguiendo el nivel de sofisticación indicado.
        Si es una Landing Page o Advertorial, incluye la estructura de secciones [SECTION_NAME].
        Asegúrate de incluir Hooks potentes y CTAs claros.
        
        ENFOQUE PSICOLOGICO:
        ${sophisticationLevel === 5 ? "Enfócate 100% en la identificación con el avatar. Olvida las promesas directas exageradas." : "Sigue el estándar del nivel de sofisticación."}
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
