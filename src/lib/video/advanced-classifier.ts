import { AiRouter } from '../ai/router';
import { TaskType } from '../ai/providers/interfaces';

/**
 * ADVANCED VIDEO CLASSIFIER
 *
 
 * Comprehensive analysis based on:
 
 * - Eugene Schwartz's 5 Awareness Levels
 
 * - Funnel Position (Top/Middle/Bottom)
 
 * - Audience Type (Cold/Warm/Hot/Retargeting)
 
 * - Script Type
 
 * - Offer Requirements
 */
export interface VideoClassification {
    // Awareness Level (Eugene Schwartz)
    awarenessLevel: 'UNAWARE' | 'PROBLEM_AWARE' | 'SOLUTION_AWARE' | 'PRODUCT_AWARE' | 'MOST_AWARE';
    awarenessScore: number;
    // 1-5

    // Funnel Position
    funnelStage: 'TOP' | 'MIDDLE' | 'BOTTOM';

    // Audience Type
    audienceType: 'COLD' | 'WARM' | 'RETARGETING' | 'HOT';

    // Script Type
    scriptType: 'EDUCATIONAL' | 'PROBLEM_AGITATION' | 'BEFORE_AFTER_BRIDGE' | 'TESTIMONIAL' | 'DIRECT_OFFER' | 'UGC' | 'DEMO';

    // Offer Strategy
    requiresOffer: boolean;
    offerType?: 'DISCOUNT_CODE' | 'FREE_SHIPPING' | 'BUNDLE' | 'URGENCY' | 'LIMITED' | 'FREE_GIFT';

    // Landing Page Recommendation
    recommendedLandingType: 'EDUCATIONAL' | 'SALES' | 'BRIDGE' | 'VSL' | 'QUIZ';

    // Marketing Concept (1-7)
    concept: number;

    // Angle & Hook
    angle?: string;
    hookScore?: number;

    // Targeting Notes
    targetingNotes: string;

    // Confidence
    confidence: number;
    // 0-1
}

export class AdvancedVideoClassifier {
    /**
    * Perform exhaustive analysis of video script
    */
    static async classifyVideo(
        script: string,
        productContext: string
    ): Promise<VideoClassification> {
        console.log('[AdvancedClassifier] Analyzing script...');

        const prompt = `Clasifica este vídeo publicitario según el sistema Spencer C1-C9.

PRODUCTO: "${productContext}"
VIDEO SCRIPT:
"${script}"

CONCEPTOS (1-9):
1. Problema: Agita el dolor o deseo insatisfecho
2. Falsa_Solución: Por qué otros métodos fallan
3. Mecanismo: Cómo funciona internamente (la pieza secreta)
4. Prueba: Testimonios, pantallazos, demostraciones
5. Autoridad: Por qué tú o la marca sois expertos
6. Historia: Narrativa del héroe o historia de origen
7. Identidad: Para quién es (ej. "Solo para madres ocupadas")
8. Resultado: Futuro deseado tras el uso
9. Oferta: Pitch de venta directo con call to action

TRÁFICO:
- COLD: No conoce el producto/marca
- WARM: Conoce la marca pero no ha comprado
- HOT_RETARGET: Listo para comprar, ha visitado web/carrito

CONSCIENCIA (Nivel 1-5):
1. Unaware: No sabe que tiene un problema
2. Problem_Aware: Sabe el problema, no la solución
3. Solution_Aware: Conoce soluciones, no tu producto
4. Product_Aware: Conoce tu marca, no está convencido
5. Most_Aware: Listo para comprar, busca oferta

Devuelve SOLO este JSON:
{
  "concept": 1,
  "audienceType": "COLD",
  "awarenessLevel": 2,
  "angle": "descripción breve del ángulo del video",
  "hookScore": 75,
  "emotionPillar": "miedo/placer/curiosidad",
  "targetingNotes": "notas estratégicas"
}`;

        try {
            const result = await AiRouter.dispatch(
                'store-main',
                TaskType.RESEARCH_FORENSIC,
                prompt,
                { jsonSchema: true }
            );

            const clean = result.text.replace(/```json\s*/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(clean);

            console.log('[AdvancedClassifier] ✅ Classification:', {
                concept: data.concept,
                audience: data.audienceType,
                awareness: data.awarenessLevel
            });

            // Normalización de datos para la interfaz interna
            return {
                awarenessLevel: data.awarenessLevel?.toString() || '2',
                awarenessScore: parseInt(data.awarenessLevel || '2'),
                funnelStage: data.audienceType === 'COLD' ? 'TOP' : data.audienceType === 'WARM' ? 'MIDDLE' : 'BOTTOM',
                audienceType: data.audienceType || 'COLD',
                scriptType: 'UGC', // Fallback
                requiresOffer: data.concept === 9,
                recommendedLandingType: data.concept >= 8 ? 'SALES' : 'EDUCATIONAL',
                concept: data.concept || 1,
                angle: data.angle || '',
                hookScore: data.hookScore || 0,
                targetingNotes: data.targetingNotes || '',
                confidence: 0.9
            };
        }
        catch (error) {
            console.error('[AdvancedClassifier] Error:', error);
            // Fallback classification
            return {
                awarenessLevel: 'PROBLEM_AWARE',
                awarenessScore: 2,
                funnelStage: 'TOP',
                audienceType: 'COLD',
                scriptType: 'EDUCATIONAL',
                requiresOffer: false,
                recommendedLandingType: 'EDUCATIONAL',
                concept: 3,
                angle: '',
                hookScore: 0,
                targetingNotes: 'Classification failed - using defaults',
                confidence: 0.3
            };
        }
    }

    /**
    * Get folder path based on classification
    */
    static getFolderPath(classification: VideoClassification): string {
        const conceptNames = ['Problema', 'Solucion', 'Mecanismo', 'Prueba', 'Autoridad', 'Estatus', 'Resultado'];
        const conceptName = conceptNames[classification.concept - 1] || 'Mecanismo';

        // Path: 04_CONCEPTOS/[Concept]/[Awareness]/[Funnel]
        return `04_CONCEPTOS/${classification.concept}-${conceptName}/${classification.awarenessLevel}/${classification.funnelStage}`;
    }

    /**
    * Generate targeting strategy document
    */
    static generateTargetingStrategy(classification: VideoClassification, productName: string): string {
        return `# Estrategia de Targeting - ${productName}

## Clasificación del Video
### Nivel de Consciencia: ${classification.awarenessLevel} (${classification.awarenessScore}/5)
${this.getAwarenessExplanation(classification.awarenessLevel)}

### Posición en Embudo: ${classification.funnelStage}
${this.getFunnelExplanation(classification.funnelStage)}

### Tipo de Audiencia: ${classification.audienceType}
${this.getAudienceExplanation(classification.audienceType)}

### Tipo de Script: ${classification.scriptType}

---

## 🎯 Recomendaciones de Targeting
### Audiencias Recomendadas:
${this.getAudienceRecommendations(classification)}

### Landing Page:
**Tipo**: ${classification.recommendedLandingType}
${this.getLandingPageGuidance(classification.recommendedLandingType)}

### Oferta Requerida:
${classification.requiresOffer ? `
✅ **SÍ*
 * - Este video necesita una oferta fuerte
**Tipo de oferta**: ${classification.offerType}
${this.getOfferGuidance(classification.offerType!)}
` : `
❌ **NO*
 * - Este video funciona sin oferta directa
Enfocado en educación/awareness antes de la conversión
`}

---

## 📊 Estrategia de Campaña
### 1. Configuración de Anuncios
- **Objetivo**: ${this.getCampaignObjective(classification)}
- **Presupuesto recomendado**: ${this.getBudgetGuidance(classification)}
- **Duración mínima**: ${this.getMinDuration(classification)}

### 2. Split Testing
${this.getSplitTestGuidance(classification)}

### 3. Secuencia de Retargeting
${this.getRetargetingSequence(classification)}

---

## ⚠️ Notas Importantes
${classification.targetingNotes}

**Confianza de clasificación**: ${(classification.confidence
                * 100).toFixed(0)}%
`;
    }

    // Helper methods for explanations
    private static getAwarenessExplanation(level: string): string {
        const explanations = {
            UNAWARE: 'El cliente no sabe que tiene un problema. Necesitas crear awareness del problema primero.',
            PROBLEM_AWARE: 'El cliente conoce su problema pero no las soluciones. Educa sobre posibles soluciones.',
            SOLUTION_AWARE: 'El cliente sabe que existen soluciones pero no conoce tu producto específico.',
            PRODUCT_AWARE: 'El cliente conoce tu producto pero no está convencido de comprarlo.',
            MOST_AWARE: 'El cliente está listo para comprar, solo necesita la oferta correcta.'
        };
        return explanations[level as keyof typeof explanations] || '';
    }

    private static getFunnelExplanation(stage: string): string {
        const explanations = {
            TOP: 'Parte alta del embudo - Awareness y educación. No mencionar precio aún.',
            MIDDLE: 'Parte media - Consideración y comparación. Introducir valor y diferenciación.',
            BOTTOM: 'Parte baja - Conversión directa. Mencionar precio, descuentos, urgencia.'
        };
        return explanations[stage as keyof typeof explanations] || '';
    }

    private static getAudienceExplanation(type: string): string {
        const explanations = {
            COLD: 'Tráfico frío - Nunca han oído hablar del producto. Necesita mucha educación.',
            WARM: 'Audiencia cálida - Han interactuado con contenido pero no compraron.',
            RETARGETING: 'Retargeting - Visitaron sitio o agregaron al carrito. Alto potencial.',
            HOT: 'Audiencia caliente - Compradores previos o altísima intención de compra.'
        };
        return explanations[type as keyof typeof explanations] || '';
    }

    private static getAudienceRecommendations(classification: VideoClassification): string {
        if (classification.audienceType === 'COLD') {
            return `- Intereses amplios relacionados con el problema
- Lookalike de visitantes del sitio (1-2%)
- Targeting por comportamientos generales`;
        }
        if (classification.audienceType === 'WARM') {
            return `- Visitantes del sitio (últimos 30 días)
- Espectadores de videos (75%+)
- Engagement en redes sociales`;
        }
        if (classification.audienceType === 'RETARGETING') {
            return `- Carritos abandonados (últimos 7 días)
- Visitantes de página de producto
- Add to cart sin compra`;
        }
        return `- Compradores previos
- Lista de emails
- Lookalike de compradores (1%)`;
    }

    private static getLandingPageGuidance(type: string): string {
        const guidance = {
            EDUCATIONAL: 'Página con explicación del mecanismo, beneficios, y CTA suave.',
            SALES: 'Página de producto directa con precio, reviews, y botón de compra prominente.',
            BRIDGE: 'Página intermedia que cuenta historia y luego lleva a producto.',
            VSL: 'Video Sales Letter de 10-15 min con pitch completo.',
            QUIZ: 'Quiz interactivo para calificar y personalizar oferta.'
        };
        return guidance[type as keyof typeof guidance] || '';
    }

    private static getOfferGuidance(offerType: string): string {
        const guidance = {
            DISCOUNT_CODE: 'Usar código de descuento del 15-30%. Mostrar en pantalla.',
            FREE_SHIPPING: 'Envío gratis en primera compra. Elimina fricción.',
            BUNDLE: 'Compra X lleva Y gratis. Aumenta ticket promedio.',
            URGENCY: '24-48h de oferta limitada. Timer en landing.',
            LIMITED: 'Solo X unidades disponibles. Scarcity real.',
            FREE_GIFT: 'Regalo gratis con compra. Percepción de valor.'
        };
        return guidance[offerType as keyof typeof guidance] || '';
    }

    private static getCampaignObjective(classification: VideoClassification): string {
        if (classification.funnelStage === 'TOP') return 'Alcance / Awareness';
        if (classification.funnelStage === 'MIDDLE') return 'Tráfico / Engagement';
        return 'Conversiones / Ventas';
    }

    private static getBudgetGuidance(classification: VideoClassification): string {
        if (classification.audienceType === 'COLD') return '€50-100/día mínimo';
        if (classification.audienceType === 'RETARGETING') return '€20-50/día';
        return '€30-70/día';
    }

    private static getMinDuration(classification: VideoClassification): string {
        if (classification.funnelStage === 'TOP') return '7-14 días (awareness necesita tiempo)';
        if (classification.funnelStage === 'MIDDLE') return '5-7 días';
        return '3-5 días (conversión rápida)';
    }

    private static getSplitTestGuidance(classification: VideoClassification): string {
        return `- Test 3 hooks diferentes (primeros 3 segundos)
- Test landing page vs VSL
- Test con/sin oferta (si es parte media)
- Test audiencias LAL 1% vs 2-3%`;
    }

    private static getRetargetingSequence(classification: VideoClassification): string {
        if (classification.funnelStage === 'TOP') {
            return `1. Este video (awareness)
2. Video de mecanismo (7 días después)
3. Video de prueba social (14 días)
4. Oferta directa (21 días)`;
        }
        if (classification.funnelStage === 'MIDDLE') {
            return `1. Este video (consideración)
2. Video de testimonios (3 días)
3. Video de oferta (7 días)`;
        }
        return `1. Este video (conversión)
2. Testimonial video (inmediato)
3. Urgency reminder (24-48h)`;
    }
}
