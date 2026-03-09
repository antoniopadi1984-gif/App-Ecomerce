import { AiRouter } from "../router";
import { TaskType, AIResponse } from "../providers/interfaces";
import { STRATEGIC_INTELLIGENCE_CORE } from "../../research/strategic-context";

/**
 * AGENTE JEFE GLOBAL: DIRECTOR CREATIVO (CHIEF CREATIVE OFFICER)
 * Tiene visión completa del Centro Creativo y orquesta los demás agentes.
 */
export class GlobalChiefAgent {
    static async getGlobalDirection(storeId: string, productId: string, activeContext: string): Promise<AIResponse> {
        const systemPrompt = `
            ROL: Agente Jefe Global del Centro Creativo (CCO).
            MISION: Supervisar la estrategia creativa global vinculada al producto activo.
            VISION: "Creative is the targeting". Asegurar consistencia entre Drive, Branding, Conceptos y Performance.
            REGLAS:
            - Todo debe estar vinculado al producto en el TopBar.
            - Nomenclatura IA Pro obligatoria en cada asset.
            - Registro automático en BD con metadatos de funnel y framework.
        `;

        const prompt = `
            PRODUCTO ACTIVO: ${productId}
            CONTEXTO ACTUAL: ${activeContext}
            TAREA: Proporciona la dirección estratégica para este ciclo creativo. 
            Define la fase de embudo prioritaria y los frameworks a utilizar.
        `;

        return AiRouter.dispatch(storeId, TaskType.DIRECTOR_STRATEGY, prompt, { systemPrompt });
    }
}

/**
 * AGENTE ESPECIALISTA: LABORATORIO DE CONCEPTOS
 */
export class ConceptSpecialistAgent {
    static async generateConcept(storeId: string, productId: string, researchData: any): Promise<AIResponse> {
        const systemPrompt = `
            ROL: Especialista en Ingeniería de Conceptos Creativos.
            MISION: Generar Hooks y Scripts masivos (AIDA, PAS, STORY, DR, MECH).
            REGLAS:
            - Cada asset generado debe tener: ID, Fase de Embudo, Framework, Variante.
            - Nomenclatura IA: HOOK_[CONC]_[TIPO]_[NUM].txt / SCRIPT_[CONC]_[FRAMEWORK]_[NUM].txt.
            - Tipos de Hook: NEG, POS, CUR, AUT, COMP, INT.
        `;

        const prompt = `
            DATA DE INVESTIGACIÓN: ${JSON.stringify(researchData)}
            TAREA: Genera 3 Conceptos creativos (C1-C7) con sus respectivos Hooks y Scripts.
        `;

        return AiRouter.dispatch(storeId, TaskType.CREATIVE_CONCEPTS, prompt, { systemPrompt, jsonSchema: true });
    }
}

/**
 * AGENTE ESPECIALISTA: BIBLIOTECA & ASSETS
 */
export class AssetsSpecialistAgent {
    static async organizeLibrary(storeId: string, driveStructure: any): Promise<AIResponse> {
        const systemPrompt = `
            ROL: Curador de Activos Globales y Branding.
            MISION: Gestionar Logos, Música, Voces y Banco de Hooks.
            REGLAS:
            - Nomenclatura IA para música: MUS_[EMOCION]_[TEMPO]_[NUM].mp3.
            - Nomenclatura IA para voces: VOZ_[AVATAR_ID]_[IDIOMA].mp3.
        `;

        const prompt = `
            ESTRUCTURA DRIVE: ${JSON.stringify(driveStructure)}
            TAREA: Analiza los activos actuales y sugiere música/voces faltantes según la emoción de los conceptos activos.
        `;

        return AiRouter.dispatch(storeId, TaskType.ASSETS_CURATOR, prompt, { systemPrompt });
    }
}

/**
 * AGENTE ESPECIALISTA: ANÁLISIS DE COMPETENCIA
 */
export class CompetitorAgent {
    static async dissectCompetitorAd(storeId: string, adUrl: string, mediaType: 'VIDEO' | 'STATIC'): Promise<AIResponse> {
        const systemPrompt = `
            ROL: Analista de Inteligencia Competitiva.
            MISION: Deconstruir creativos de la competencia.
            REGLAS:
            - Output: JSON con análisis de estructura, hook, oferta y debilidades.
            - Nomenclatura IA: COMP_[MARCA]_[NUM]_ANALISIS.json.
        `;

        const prompt = `URL AD COMPETENCIA: ${adUrl} (${mediaType}). TAREA: Extrae el ángulo y el framework que están usando.`;

        return AiRouter.dispatch(storeId, TaskType.COMPETITOR_SPY, prompt, { systemPrompt, jsonSchema: true });
    }
}

/**
 * AGENTE ESPECIALISTA: RENDIMIENTO (SCORECARD)
 */
export class PerformanceAgent {
    static async analyzeScores(storeId: string, metrics: any): Promise<AIResponse> {
        const systemPrompt = `
            ROL: Data Scientist Creativo (Performance Guru).
            MISION: Evaluar CTR, CPA, ROAS, Hook Rate, 3s View por creativo.
            REGLAS:
            - Generar SCORECARD_[PROD]_[MES].json.
            - Identificar creativos ganadores y perdedores (Kill/Scale).
        `;

        const prompt = `MÉTRICAS: ${JSON.stringify(metrics)}. TAREA: Genera el diagnóstico de rendimiento.`;

        return AiRouter.dispatch(storeId, TaskType.PERFORMANCE_ADS, prompt, { systemPrompt, jsonSchema: true });
    }
}

/**
 * AGENTE ESPECIALISTA: COPYWRITER DE RESPUESTA DIRECTA
 */
export class CopywriterAgent {
    static async generateSalesLetter(storeId: string, context: string, targetAvatar: any): Promise<AIResponse> {
        const systemPrompt = `
            ROL: Copywriter de Respuesta Directa nivel Dios.
            REGLAS SPENCER: LP_[CONC]_[TIPO]_[VAR].html. Tipos: LP, ADV, LIST, VSL.
        `;

        const prompt = `
            CONTEXTO: ${context}
            AVATAR: ${JSON.stringify(targetAvatar)}
            TAREA: Escribe el borrador de la Landing Page.
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
            ROL: Guionista Senior de Video Marketing.
            NOMENCLATURA SPENCER: VID_[CONC]_[FASE]_[HOOK]_[FORMATO]_[VAR].mp4.
        `;

        const prompt = `
            RESEARCH: ${JSON.stringify(researchData)}
            TIPO: ${videoType}
            TAREA: Genera un guion detallado.
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
            ROL: Especialista Senior en CRO.
        `;

        const prompt = `
            JERARQUÍA: ${JSON.stringify(pageHierarchy)}
            DATA: ${JSON.stringify(researchData)}
            TAREA: Mejora de 5 puntos críticos.
        `;

        return AiRouter.dispatch(storeId, TaskType.CRO_AUDIT, prompt, { systemPrompt });
    }
}

/**
 * AGENTE ESPECIALISTA: INVESTIGADOR FORENSE (GOD TIER)
 */
export class ForensicResearcherAgent {
    static async executeDeepAnalysis(storeId: string, productTitle: string, initialEvidence: string, productFamily: string = ''): Promise<AIResponse> {
        const systemPrompt = STRATEGIC_INTELLIGENCE_CORE;

        const prompt = `
            PRODUCTO: ${productTitle}
            EVIDENCIA: ${initialEvidence}
            TAREA: Extrae el DNA Forense.
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
            ROL: Director Creativo de Video Ads.
        `;

        const prompt = `
            CONTEXTO: ${context}
            TAREA: Realiza una disección forense del video.
        `;

        return AiRouter.dispatch(storeId, TaskType.VIDEO_DISSECTION, prompt, { systemPrompt, jsonSchema: true });
    }
}

