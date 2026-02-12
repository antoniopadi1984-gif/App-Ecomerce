import { AiRouter } from '../ai/router';
import { TaskType } from '../ai/providers/interfaces';

/**
 * Research Quality Scorer - Evalúa research con Gemini 3
 */

export interface QualityScore {
    score: number; // 1-10
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    completeness: number; // 0-100%
    breakdown: {
        productDNA: number; // 1-10
        vocInsights: number; // 1-10
        avatars: number; // 1-10
        angles: number; // 1-10
        competitive: number; // 1-10
        offers: number; // 1-10
    };
}

export class ResearchQualityScorer {
    /**
     * Evalúa quality de research completo
     */
    static async evaluateResearch(data: {
        productId: string;
        productName: string;
        productDNA?: any;
        vocInsights?: any;
        avatars?: any;
        angles?: any;
        competitive?: any;
        offers?: any;
    }): Promise<QualityScore> {
        console.log('[QualityScorer] Evaluating research for:', data.productName);

        const prompt = `Eres un experto en Research Quality Assurance para marketing de productos.

PRODUCTO: ${data.productName}

RESEARCH DATA DISPONIBLE:
- Product DNA: ${data.productDNA ? 'SÍ' : 'NO'}
- VOC Insights: ${data.vocInsights ? `${Object.keys(data.vocInsights).length} insights` : 'NO'}
- Avatars: ${data.avatars ? `${Array.isArray(data.avatars) ? data.avatars.length : 0} avatars` : 'NO'}
- Angles: ${data.angles ? 'SÍ' : 'NO'}
- Competitive Analysis: ${data.competitive ? 'SÍ' : 'NO'}
- Offer Stacks: ${data.offers ? `${Array.isArray(data.offers) ? data.offers.length : 0} offers` : 'NO'}

DETAILED DATA:
${JSON.stringify({ productDNA: data.productDNA, vocInsights: data.vocInsights, avatars: data.avatars }, null, 2).substring(0, 3000)}

TAREA:
Evalúa la calidad de este research y asigna un score de 1-10.

Responde en JSON con este formato EXACTO:
{
  "score": 8.5,
  "strengths": [
    "Deep VOC analysis (512 insights)",
    "Unique mechanism clearly identified"
  ],
  "weaknesses": [
    "Competitive analysis incomplete",
    "Missing Reddit social proof"
  ],
  "recommendations": [
    "Add 3 competitor Amazon URLs",
    "Run market validation module"
  ],
  "completeness": 75,
  "breakdown": {
    "productDNA": 9,
    "vocInsights": 8,
    "avatars": 7,
    "angles": 8,
    "competitive": 3,
    "offers": 0
  }
}

CRITERIOS DE SCORING:
- 9-10: Research excepcional, listo para campañas
- 7-8: Buen research, pequeñas mejoras
- 5-6: Research básico, falta profundidad
- 1-4: Research incompleto, requiere trabajo

Responde SOLO con el JSON, sin texto adicional.`;

        const result = await AiRouter.dispatch(
            'default',
            TaskType.RESEARCH_DEEP,
            prompt,
            { jsonSchema: true }
        );

        try {
            const jsonMatch = result.text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No valid JSON found in quality evaluation');
            }

            const evaluation: QualityScore = JSON.parse(jsonMatch[0]);

            console.log(`[QualityScorer] ✅ Score: ${evaluation.score}/10`);

            return evaluation;

        } catch (e) {
            console.error('[QualityScorer] Parse error:', e);

            // Fallback score
            return {
                score: 5,
                strengths: ['Research data available'],
                weaknesses: ['Could not evaluate properly'],
                recommendations: ['Manual review recommended'],
                completeness: 50,
                breakdown: {
                    productDNA: 5,
                    vocInsights: 5,
                    avatars: 5,
                    angles: 5,
                    competitive: 5,
                    offers: 0
                }
            };
        }
    }

    /**
     * Quick scoring (sin llamada a AI)
     */
    static quickScore(data: {
        vocCount: number;
        avatarCount: number;
        hasAngles: boolean;
        hasCompetitive: boolean;
        offerCount: number;
    }): number {
        let score = 0;

        // VOC (max 3 points)
        if (data.vocCount >= 500) score += 3;
        else if (data.vocCount >= 300) score += 2;
        else if (data.vocCount >= 100) score += 1;

        // Avatars (max 2 points)
        if (data.avatarCount >= 5) score += 2;
        else if (data.avatarCount >= 3) score += 1;

        // Angles (max 2 points)
        if (data.hasAngles) score += 2;

        // Competitive (max 2 points)
        if (data.hasCompetitive) score += 2;

        // Offers (max 1 point)
        if (data.offerCount >= 3) score += 1;

        return score; // 0-10
    }
}
