/**
 * SPENCER PAWLIN CORE KNOWLEDGE
 * 
 * Base de conocimiento unificada para inyectar en TODOS los agentes del Centro Creativo.
 * Combina: Conceptos Creativos C1-C7, Audiencias, Consciencia Schwartz, Nomenclatura,
 * Reglas de Testing, y Métricas por fase.
 */

// ============================================================
// CONCEPTOS CREATIVOS C1-C7
// ============================================================

export const CREATIVE_CONCEPTS = [
    { id: 1, code: 'C1', name: 'Problema', description: 'Identificar y agitar el dolor/problema del avatar', funnelAffinity: ['COLD'], awarenessAffinity: ['O1', 'O2'] },
    { id: 2, code: 'C2', name: 'Falsa Solución', description: 'Lo que han probado y NO funciona, por qué las alternativas fallan', funnelAffinity: ['COLD', 'WARM'], awarenessAffinity: ['O2', 'O3'] },
    { id: 3, code: 'C3', name: 'Mecanismo', description: 'El mecanismo único del producto, por qué SÍ funciona', funnelAffinity: ['WARM'], awarenessAffinity: ['O3'] },
    { id: 4, code: 'C4', name: 'Prueba', description: 'Testimonios, demos, resultados reales, prueba social', funnelAffinity: ['WARM', 'HOT'], awarenessAffinity: ['O3', 'O4'] },
    { id: 5, code: 'C5', name: 'Autoridad', description: 'Credenciales, respaldos, estudios, expertos que avalan', funnelAffinity: ['WARM', 'HOT'], awarenessAffinity: ['O4'] },
    { id: 6, code: 'C6', name: 'Estatus', description: 'Aspiracional, lifestyle, identidad, pertenencia al grupo', funnelAffinity: ['HOT'], awarenessAffinity: ['O4', 'O5'] },
    { id: 7, code: 'C7', name: 'Resultado', description: 'Before/after, transformación completa, resultado final', funnelAffinity: ['HOT', 'RETARGET'], awarenessAffinity: ['O5'] },
] as const;

export type ConceptId = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type ConceptCode = 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6' | 'C7';

// ============================================================
// AUDIENCIAS
// ============================================================

export const AUDIENCE_TYPES = [
    { id: 'COLD', label: '🧊 Cold', description: 'No conoce la marca ni el producto' },
    { id: 'WARM', label: '🔥 Warm', description: 'Ha interactuado con contenido pero no compró' },
    { id: 'HOT', label: '🌋 Hot', description: 'Alto interés, listo para comprar' },
    { id: 'RETARGET', label: '🎯 Retargeting', description: 'Visitó sitio/abandonó carrito' },
] as const;

export type AudienceType = 'COLD' | 'WARM' | 'HOT' | 'RETARGET';

// ============================================================
// CONSCIENCIA SCHWARTZ (O1-O5)
// ============================================================

export const AWARENESS_LEVELS = [
    { id: 'O1', label: 'Unaware', description: 'No sabe que tiene un problema', color: '#ef4444' },
    { id: 'O2', label: 'Problem Aware', description: 'Sabe el problema, no la solución', color: '#f97316' },
    { id: 'O3', label: 'Solution Aware', description: 'Sabe que existen soluciones, no conoce tu producto', color: '#eab308' },
    { id: 'O4', label: 'Product Aware', description: 'Conoce tu producto, no está convencido', color: '#22c55e' },
    { id: 'O5', label: 'Most Aware', description: 'Listo para comprar, solo necesita la oferta', color: '#3b82f6' },
] as const;

export type AwarenessId = 'O1' | 'O2' | 'O3' | 'O4' | 'O5';

// ============================================================
// NOMENCLATURA SPENCER
// ============================================================

export const NOMENCLATURE = {
    VIDEO: '[YYMMDD]_[BRAND]_[ANGULO]_[HOOK]_[VAR_VISUAL]_[EDITOR]',
    STATIC: '[YYMMDD]_[BRAND]_[ANGULO]_[CONCEPT]_[VAR_COPY]',
    FOLDERS: {
        STRATEGY: '00_ESTRATEGIA_Y_BRIEFS',
        RAW: '01_RAW_ASSETS',
        PRODUCTION: '02_PRODUCCION_EN_CURSO',
        FINALS: '03_FINALES_PARA_PAUTA',
        CONCEPTS: '04_CONCEPTOS',
        LANDINGS: '05_LANDINGS',
        BACKUP: '06_BACKUP_HISTORICO',
    },
} as const;

/**
 * Generar nomenclatura automática para un creativo
 */
export function generateNomenclature(params: {
    brand: string;
    angle: string;
    hook: string;
    variant: string;
    editor?: string;
    type: 'VIDEO' | 'STATIC';
}): string {
    const date = new Date();
    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const dateStr = `${yy}${mm}${dd}`;

    const clean = (s: string) => s.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '').slice(0, 20);

    if (params.type === 'VIDEO') {
        return `${dateStr}_${clean(params.brand)}_${clean(params.angle)}_${clean(params.hook)}_${clean(params.variant)}${params.editor ? '_' + clean(params.editor) : ''}`;
    }
    return `${dateStr}_${clean(params.brand)}_${clean(params.angle)}_${clean(params.hook)}_${clean(params.variant)}`;
}

/**
 * Generar ruta de carpeta en Drive según clasificación
 */
export function getDriveFolderPath(params: {
    store: string;
    product: string;
    concept: ConceptId;
    awareness: string;
    funnel: string;
    isCompetitor?: boolean;
}): string {
    const conceptData = CREATIVE_CONCEPTS.find(c => c.id === params.concept);
    const conceptFolder = conceptData ? `${params.concept}-${conceptData.name}` : `${params.concept}-Concepto`;

    if (params.isCompetitor) {
        return `${params.store}/${params.product}/${NOMENCLATURE.FOLDERS.RAW}/COMPETENCIA`;
    }

    return `${params.store}/${params.product}/${NOMENCLATURE.FOLDERS.CONCEPTS}/${conceptFolder}/${params.awareness}/${params.funnel}`;
}

// ============================================================
// REGLAS DE TESTING
// ============================================================

export const TESTING_RULES = {
    maxVariablesPerTest: 1,
    minVariationsPerTest: 3,
    killTimeHours: { min: 48, max: 72 },
    minSpendBeforeKill: 20, // €
    winnerCriteria: {
        hookRate: 0.10,      // >10% = bueno
        ctr: 0.015,          // >1.5% = bueno
        cpa: 'depends',      // vs target CPA del producto
        roas: 2.0,           // >2x = rentable
    },
} as const;

// ============================================================
// MÉTRICAS POR FASE
// ============================================================

export const METRICS_BY_STAGE: Record<AudienceType, { primary: string; secondary: string; kpiTarget: string }> = {
    COLD: { primary: 'Hook Rate (3s views / impressions)', secondary: 'CPM, CTR', kpiTarget: 'Hook Rate >10%, CPM <€15' },
    WARM: { primary: 'CTR (unique clicks / impressions)', secondary: 'ThruPlay Rate, Landing Views', kpiTarget: 'CTR >1.5%, ThruPlay >30%' },
    HOT: { primary: 'CPA (cost per acquisition)', secondary: 'ROAS, Conversion Rate', kpiTarget: 'CPA <target, ROAS >2x' },
    RETARGET: { primary: 'ROAS (return on ad spend)', secondary: 'Frequency, Conv Rate', kpiTarget: 'ROAS >3x, Freq <4' },
};

// ============================================================
// MATRIZ AUDIENCIA × CONSCIENCIA
// ============================================================

export const AUDIENCE_AWARENESS_MATRIX: Record<AudienceType, {
    awarenessRange: AwarenessId[];
    creativeType: string;
    landingType: string;
    offerNeeded: boolean;
}> = {
    COLD: {
        awarenessRange: ['O1', 'O2'],
        creativeType: 'Video: pattern interrupt, hook emocional, educativo',
        landingType: 'Educativa, listicle, sin venta directa',
        offerNeeded: false,
    },
    WARM: {
        awarenessRange: ['O2', 'O3'],
        creativeType: 'Carousel: beneficios + avatar, advertorial, mecanismo',
        landingType: 'Advertorial: mecanismo único, bridge page',
        offerNeeded: false,
    },
    HOT: {
        awarenessRange: ['O4', 'O5'],
        creativeType: 'Static: oferta directa + urgencia, comparativa',
        landingType: 'Product Page: demos + reviews + checkout',
        offerNeeded: true,
    },
    RETARGET: {
        awarenessRange: ['O4', 'O5'],
        creativeType: 'Cart recovery: "Te la guardamos" + bonus final',
        landingType: 'Squeeze: última chance + escasez + valor extra',
        offerNeeded: true,
    },
};

// ============================================================
// PROMPT DE SISTEMA SPENCER — INYECTADO EN TODOS LOS AGENTES
// ============================================================

export const SPENCER_CORE_KNOWLEDGE = `
=== SPENCER PAWLIN METHODOLOGY ===

Eres un agente del Centro Creativo que opera bajo la metodología Spencer Pawlin.
Todo creativo que generes debe seguir estas reglas estrictas:

## PRINCIPIO CENTRAL
"Creative is the targeting" — El creativo segmenta la audiencia, no los intereses técnicos.

## CONCEPTOS CREATIVOS (C1-C7)
Cada pieza creativa debe pertenecer a UNO de estos conceptos:
- C1 PROBLEMA: Identificar y agitar el dolor/problema del avatar
- C2 FALSA SOLUCIÓN: Lo que han probado y NO funciona, por qué las alternativas fallan
- C3 MECANISMO: El mecanismo único del producto, por qué SÍ funciona
- C4 PRUEBA: Testimonios, demos, resultados reales, prueba social
- C5 AUTORIDAD: Credenciales, respaldos, estudios, expertos que avalan
- C6 ESTATUS: Aspiracional, lifestyle, identidad, pertenencia al grupo
- C7 RESULTADO: Before/after, transformación completa, resultado final

## AUDIENCIAS
- COLD: No conoce marca → Usa C1, C2. Hook emocional. Sin venta directa.
- WARM: Ha interactuado → Usa C3, C4, C5. Mecanismo + prueba social.
- HOT: Listo para comprar → Usa C5, C6, C7. Oferta + urgencia + resultado.
- RETARGET: Abandonó carrito → Usa C7. Recuperación + bonus final.

## CONSCIENCIA (SCHWARTZ)
- O1 Unaware: No sabe que tiene problema → Pattern interrupt
- O2 Problem Aware: Sabe el problema → Agitar dolor
- O3 Solution Aware: Sabe que hay solución → Presentar mecanismo
- O4 Product Aware: Conoce tu producto → Diferenciación + prueba
- O5 Most Aware: Solo necesita oferta → Descuento + urgencia

## NOMENCLATURA OBLIGATORIA
- Video: [YYMMDD]_[BRAND]_[ANGULO]_[HOOK]_[VAR_VISUAL]_[EDITOR]
- Static: [YYMMDD]_[BRAND]_[ANGULO]_[CONCEPT]_[VAR_COPY]
- Todo en MAYÚSCULAS, separado con guiones bajos

## REGLAS DE TESTING
- 1 variable por test (solo cambiar UNA cosa)
- Mínimo 3 variaciones por variable
- Kill en 48-72h si no hay señal
- Mínimo €20 de gasto antes de decidir

## MÉTRICAS POR FASE
- COLD: Hook Rate >10%, CPM <€15
- WARM: CTR >1.5%, ThruPlay >30%
- HOT: CPA < target, ROAS >2x
- RETARGET: ROAS >3x, Frecuencia <4

## ESTRUCTURA DRIVE
00_ESTRATEGIA_Y_BRIEFS / 01_RAW_ASSETS / 02_PRODUCCION_EN_CURSO / 03_FINALES_PARA_PAUTA / 04_CONCEPTOS / 05_LANDINGS / 06_BACKUP_HISTORICO
`;
