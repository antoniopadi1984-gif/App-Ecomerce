import { AiRouter } from "../router";
import { TaskType, AIResponse } from "../providers/interfaces";
import { STRATEGIC_INTELLIGENCE_CORE } from "../../research/strategic-context";

/**
 * AGENTE ESPECIALISTA: COPYWRITER DE RESPUESTA DIRECTA
 */
export class CopywriterAgent {
    static async generateSalesLetter(storeId: string, context: string, targetAvatar: any): Promise<AIResponse> {
        const systemPrompt = `
            ROL: Copywriter de Respuesta Directa nivel Dios (Estilo Hormozi + Schwartz + Kennedy).
            MISION: Escribir una Sales Letter que convierta desconocidos en clientes leales.
            REGLAS:
            - Usa el Gancho Emocional Primario detectado en la investigación.
            - Estructura: Hook -> Problema -> Agitación -> Mecanismo Único -> Oferta -> Garantía.
            - Tono: Directo, visceral, rompiendo creencias limitantes.
            - Metodología: Investigación Profunda real.
            - NOMENCLATURA SPENCER PAWLIN: Asegúrate de referenciar el Spencer Angle Code y Spencer Hook Code en los borradores para trazabilidad.
            - IDENTIDAD VISUAL: Si la investigación incluye paleta de colores y tipografía, úsalas para sugerir la apariencia de la página y elementos de diseño.
        `;

        const prompt = `
            CONTEXTO DE INVESTIGACIÓN:
            ${context}

            AVATAR OBJETIVO:
            ${JSON.stringify(targetAvatar)}

            TAREA: Escribe el borrador completo de una Sales Letter de alta conversión.
        `;

        return AiRouter.dispatch(storeId, TaskType.COPYWRITING_PAGES, prompt, { systemPrompt });
    }
}

/**
 * AGENTE ESPECIALISTA: GUIONISTA DE VIDEO (SCRIPTS)
 */
export class ScriptWriterAgent {
    static async generateAdvancedScript(storeId: string, researchData: any, videoType: string = 'VSL'): Promise<AIResponse> {
        const systemPrompt = `
            ROL: Guionista Senior de Video Marketing (VSL & Ads Virales).
            MISION: Crear un guion optimizado para retención y conversión.
            REGLAS:
            - Minuto 0-5s: Hook visual y verbal disruptivo.
            - Storytelling basado en la "Capa de Verdad" de la investigación.
            - Llamada a la acción clara y potente.
            - NOMENCLATURA OBLIGATORIA (Spencer Pawlin): Los guiones generados DEBEN proponer un nombre de archivo siguiendo el patrón: [YYMMDD]_[BRAND]_[ANGULO]_[HOOK]_[VAR_VISUAL]_[EDITOR].
            - DIRECCIÓN DE ARTE: Incorpora las directrices visuales (estilo de video, iluminación, vibe) en las descripciones de escena del guion.
        `;

        const prompt = `
            INVESTIGACIÓN FORENSE:
            ${JSON.stringify(researchData)}

            TIPO DE VIDEO: ${videoType}

            TAREA: Genera un guion detallado (Visual | Audio) con timestamps sugeridos.
        `;

        return AiRouter.dispatch(storeId, TaskType.SCRIPTS_ADVANCED, prompt, { systemPrompt });
    }
}

/**
 * AGENTE ESPECIALISTA: AUDITOR DE CRO (CONVERSIÓN)
 */
export class CroSpecialistAgent {
    static async auditLandingPage(storeId: string, pageHierarchy: any, researchData: any): Promise<AIResponse> {
        const systemPrompt = `
            ROL: Especialista Senior en CRO (Conversion Rate Optimization).
            MISION: Auditar y mejorar la arquitectura de persuasión de la landing page.
            REGLAS:
            - Identifica fricciones cognitivas.
            - Asegura que el Mecanismo Único esté bien posicionado.
            - Verifica que los CTAs resuelvan el dolor principal del avatar.
        `;

        const prompt = `
            JERARQUÍA DE PÁGINA:
            ${JSON.stringify(pageHierarchy)}

            DATA DE MERCADO:
            ${JSON.stringify(researchData)}

            TAREA: Proporciona 5 mejoras críticas de CRO basadas en psicología de mercado.
        `;

        return AiRouter.dispatch(storeId, TaskType.CRO_AUDIT, prompt, { systemPrompt });
    }
}

/**
 * AGENTE ESPECIALISTA: INVESTIGADOR FORENSE (GOD TIER)
 */
export class ForensicResearcherAgent {
    static async executeDeepAnalysis(storeId: string, productTitle: string, initialEvidence: string, productFamily: string = ''): Promise<AIResponse> {
        const systemPrompt = STRATEGIC_INTELLIGENCE_CORE; // Use the God Tier methodology

        const prompt = `
            PRODUCTO: ${productTitle}
            FAMILIA: ${productFamily}
            EVIDENCIA RECOLECTADA: ${initialEvidence}

            TAREA: Ejecuta la Fase 1 y 2 de la metodología GOD TIER. 
            Extrae el DNA Forense y el Truth Layer real.
        `;

        return AiRouter.dispatch(storeId, TaskType.RESEARCH_FORENSIC, prompt, { jsonSchema: true });
    }
}

/**
 * AGENTE ESPECIALISTA: DIRECTOR DE VIDEO CREATIVO
 */
export class VideoDirectorAgent {
    static async dissectVideo(storeId: string, context: string): Promise<AIResponse> {
        const systemPrompt = `
            ROL: Director Creativo de Video Ads (Ex-Harmon Brothers).
            MISION: Deconstruir videos ganadores para extraer su estructura persuasiva.
            REGLAS:
            - Identifica el Hook visual y auditivo exacto.
            - Mapea la retención segundo a segundo.
            - Extrae la lógica de conversión (por qué funciona).
        `;

        const prompt = `
            CONTEXTO DEL VIDEO:
            ${context}

            TAREA: Realiza una disección forense del video.
        `;

        return AiRouter.dispatch(storeId, TaskType.VIDEO_DISSECTION, prompt, { systemPrompt, jsonSchema: true });
    }
}

