export type AwarenessLevel = 'O1' | 'O2' | 'O3' | 'O4' | 'O5'; // Unaware to Most Aware
export type SophisticationLevel = 1 | 2 | 3 | 4 | 5;

export interface ValueEquation {
    dreamOutcome: string;
    perceivedLikelihood: string;
    timeDelay: string;
    effortSacrifice: string;
}

export interface CopyContract {
    avatarSegment: string;
    awareness: AwarenessLevel;
    sophistication: SophisticationLevel;
    mechanism: string;
    mainAngle: string;
    valueEquation: ValueEquation;
    triggers: string[];
    promisesAllowed: string[];
    promisesProhibited: string[];
    objectionToKill: string;
    proofType: string;
    cta: string;
    tone: 'DIRECT' | 'EMPATHETIC' | 'AUTHORITY';
    reasoning?: {
        awarenessContext: string;
        sophisticationReason: string;
        mechanismExplanation: string;
    };
}

export type KnowledgeNodeType = 'AVATAR' | 'ANGLE' | 'CREATIVE' | 'LANDING' | 'OBJECTION' | 'CLAIM';
export type KnowledgeRelationType = 'USES' | 'RESPONDS_TO' | 'CONVERTS_WELL_WITH' | 'CAUSES_RETURNS' | 'COUNTER_ATTACKS';

export interface MaturityScore {
    research: number; // 0-1
    avatar: number;
    landing: number;
    creatives: number;
    postVenta: number;
    overall: number;
}

export const EXPERT_PROMPT_TEMPLATES = {
    COPY_CONTRACT: `
        Actúa como un Director de Copy de respuesta directa de élite.
        Tu misión es generar un CONTRATO DE COPY IRROMPIBLE para este producto.
        Este contrato servirá de frontera lógica: nada escrito fuera de estas reglas será válido.
        
        FRAMEWORKS REQUERIDOS:
        - Breakthrough Advertising (Consciencia y Sofisticación)
        - Ecuación de Valor de Alex Hormozi
        - Gatillos de Cashvertising
        
        DATOS DE INVESTIGACIÓN:
        {{researchContext}}
        
        PRODUCTO: {{productTitle}}
        
        NECESITO (JSON):
        {
           "avatarSegment": "...",
           "awareness": "O1/O2/O3/O4/O5",
           "sophistication": 1-5,
           "mechanism": "El mecanismo único que hace que funcione",
           "mainAngle": "Ángulo de ataque",
           "valueEquation": {
              "dreamOutcome": "Resultado soñado",
              "perceivedLikelihood": "Cómo aumentamos la creencia",
              "timeDelay": "Tiempo hasta el resultado",
              "effortSacrifice": "Esfuerzo del usuario"
           },
           "triggers": ["Curiosidad", "Miedo a perder", ...],
           "promisesAllowed": ["..."],
           "promisesProhibited": ["..."],
           "objectionToKill": "La objeción #1 a demoler",
           "proofType": "Demostración/Testimonio/Cita científica",
           "cta": "Llamada a la acción específica",
           "tone": "DIRECT/EMPATHETIC/AUTHORITY",
           "reasoning": {
              "awarenessContext": "Por qué este nivel de consciencia es el adecuado",
              "sophisticationReason": "Justificación del nivel de sofisticación elegido",
              "mechanismExplanation": "Lógica detrás del mecanismo único propuesto"
           }
        }
    `,
    COPY_LINT: `
        Eres el Copy Linter Senior. Revisa el siguiente COPY contra el CONTRATO DE COPY.
        
        CONTRATO: {{contract}}
        COPY: {{copy}}
        
        REGLAS DE ORO:
        1. No claims ilegales o de salud extrema.
        2. Cero frases vagas ("resultados increíbles", "revolucionario").
        3. El CTA debe coincidir con el contrato.
        4. Debe atacar la objeción principal.
        
        RESPONDE SOLO EN JSON:
        {
           "pass": true/false,
           "issues": [
              { "type": "ERROR/WARNING", "message": "...", "fix": "..." }
           ],
           "correctedVersion": "..."
        }
    `
};
