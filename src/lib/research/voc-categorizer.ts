import { VOCInsightService } from './voc-insight-service';
import { AiRouter } from '../ai/router';
import { TaskType } from '../ai/providers/interfaces';

/**
 * VOC Categorizer - Uses Gemini 3 to categorize VOC phrases
 */

export interface VOCPhrase {
    phrase: string;
    meaning?: string;
    emotion?: string;
}

export interface CategorizedVOC {
    phrase: string;
    category: 'PAIN' | 'DESIRE' | 'OBJECTION' | 'TRIGGER';
    emotionalIntensity: number; // 1-10
    funnelStage: 'COLD' | 'WARM' | 'HOT';
    verbatimSource?: string;
}

export class VOCCategorizer {
    /**
     * Categoriza una lista de frases VOC usando Gemini 3
     */
    static async categorize(phrases: VOCPhrase[], productContext?: string): Promise<CategorizedVOC[]> {
        if (phrases.length === 0) return [];

        console.log(`[VOCCategorizer] Categorizing ${phrases.length} phrases...`);

        const prompt = `Eres un experto en psicología de marketing y Voice of Customer analysis.

CONTEXTO DEL PRODUCTO:
${productContext || 'No disponible'}

TAREA:
Categoriza cada una de las siguientes frases VOC en:
- category: 'PAIN' | 'DESIRE' | 'OBJECTION' | 'TRIGGER'
- emotionalIntensity: 1-10 (qué tan intensa es la emoción)
- funnelStage: 'COLD' | 'WARM' | 'HOT' (en qué etapa del funnel funciona mejor)

CATEGORÍAS:
- PAIN: Dolor, frustración, problema
- DESIRE: Deseo, aspiración, beneficio buscado
- OBJECTION: Objeción, duda, miedo
- TRIGGER: Palabra/frase que activa compra (urgencia, scarcity, proof)

FUNNEL STAGES:
- COLD: Audiencia fr fría, no conoce solución
- WARM: Conoce solución, comparando opciones
- HOT: Listo para comprar, necesita último empujón

FRASES:
${phrases.map((p, i) => `${i + 1}. "${p.phrase}"${p.meaning ? ` (${p.meaning})` : ''}`).join('\n')}

Responde SOLO con un JSON array:
[
  {
    "phrase": "la frase exacta",
    "category": "PAIN|DESIRE|OBJECTION|TRIGGER",
    "emotionalIntensity": 1-10,
    "funnelStage": "COLD|WARM|HOT"
  },
  ...
]`;

        const result = await AiRouter.dispatch(
            'default',
            TaskType.RESEARCH_DEEP,
            prompt,
            { jsonSchema: true }
        );

        try {
            // Parse result
            const jsonMatch = result.text.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                console.error('[VOCCategorizer] No valid JSON found');
                return [];
            }

            const categorized: CategorizedVOC[] = JSON.parse(jsonMatch[0]);

            console.log(`[VOCCategorizer] ✅ Categorized: ${categorized.length} phrases`);

            return categorized;

        } catch (e) {
            console.error('[VOCCategorizer] Parse error:', e);
            return [];
        }
    }

    /**
     * Categoriza y guarda en DB
     */
    static async categorizeAndSave(
        productId: string,
        researchRunId: string,
        phrases: VOCPhrase[],
        productContext?: string
    ) {
        const categorized = await this.categorize(phrases, productContext);

        if (categorized.length === 0) {
            console.warn('[VOCCategorizer] No phrases categorized, skipping save');
            return [];
        }

        // Save to DB
        const saved = await VOCInsightService.saveBatch(
            categorized.map(c => ({
                productId,
                researchRunId,
                phrase: c.phrase,
                category: c.category,
                emotionalIntensity: c.emotionalIntensity,
                funnelStage: c.funnelStage,
                verbatimSource: c.verbatimSource
            }))
        );

        console.log(`[VOCCategorizer] ✅ Saved ${saved.length} insights to DB`);

        return saved;
    }

    /**
     * Get categorized stats
     */
    static async getStats(productId: string) {
        return await VOCInsightService.getStats(productId);
    }

    /**
     * Get top insights by category
     */
    static async getTopByCategory(productId: string, limit: number = 20) {
        return await VOCInsightService.getTopByCategory(productId, limit);
    }
}
