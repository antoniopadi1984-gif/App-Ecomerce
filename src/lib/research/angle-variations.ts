import { AiRouter } from '../ai/router';

/**
 * ANGLE VARIATION PROMPTS
 * Generate tonal variations of successful angles
 */
export const ANGLE_VARIATION_PROMPTS = {
    GENERATE_VARIATIONS: `
Actúa como Eugene Schwartz + Gary Halbert + un Director Creativo de Campañas Ganadoras.

MISIÓN: Generar 5 variaciones tonales del mismo ángulo base, cada una optimizada para diferentes niveles de sofisticación y awareness.

═══════════════════════════════════════════════════════════════
ÁNGULO BASE
═══════════════════════════════════════════════════════════════
{{baseAngle}}

═══════════════════════════════════════════════════════════════
AVATAR CONTEXT
═══════════════════════════════════════════════════════════════
{{avatarJson}}

═══════════════════════════════════════════════════════════════
TIPO DE VARIACIÓN: {{variationType}}
═══════════════════════════════════════════════════════════════

**DIRECT** (Para Awareness 4-5, Sophistication 1-2):
- Directo al dolor → solución
- Sin rodeos, sin historias
- Claim claro y específico
- Ejemplo: "Elimina el dolor de espalda en 7 días con el método japonés de 3 capas térmicas"

**STORY** (Para Awareness 2-3, Sophistication 3-4):
- Introduce con historia relatable
- Agitación emocional
- Revelación del mecanismo
- Ejemplo: "María llevaba 8 años con dolor crónico. Probó 14 tratamientos diferentes. Todo cambió cuando descubrió el secreto japonés de las 3 capas térmicas..."

**HYBRID** (Para Awareness 3-4, Sophistication 3):
- Gancho de historia (15 segundos)
- Pivot rápido a mecanismo
- Balance emoción + lógica
- Ejemplo: "Después de 3 cirugías fallidas, descubrí algo que los médicos no me dijeron: tu dolor no viene de donde crees. El método japonés de compresión térmica de 3 capas..."

**CONTRARIAN** (Para Awareness 4-5, Sophistication 5):
- Desafía creencia común
- Crea disonancia cognitiva
- Reposiciona el problema
- Ejemplo: "Todo lo que te dijeron sobre el dolor de espalda está mal. No es tu postura. No es tu colchón. Es tu temperatura interna..."

**IDENTITY** (Para Awareness 3-5, Sophistication 4-5):
- Habla a la identidad, no al problema
- "Para personas que..."
- Exclusividad psicológica
- Ejemplo: "Para profesionales que se niegan a aceptar que el dolor es 'parte de la edad'. El método japonés diseñado para mentes jóvenes atrapadas en cuerpos que duelen..."

═══════════════════════════════════════════════════════════════
SALIDA JSON
═══════════════════════════════════════════════════════════════

Genera 5 variaciones del ángulo base, una para cada tipo (DIRECT, STORY, HYBRID, CONTRARIAN, IDENTITY).

{
  "variations": [
    {
      "type": "DIRECT",
      "concept": "Concepto del ángulo en 1 frase",
      "headline": "Headline gancho (60-80 caracteres)",
      "opening_hook": "Primeros 15 segundos del VSL (80-120 palabras)",
      "core_mechanism": "El mecanismo único explicado",
      "voc_phrases_used": ["frase literal del avatar", "otra frase VOC"],
      "sophistication_level": 1-5,
      "awareness_target": "Unaware | Problem Aware | Solution Aware | Product Aware | Most Aware",
      "psychological_hook": "Scarcity | Authority | Social Proof | Fear | Desire | Identity | Contrarian",
      "use_case": "Para qué tipo de tráfico/audiencia funciona mejor"
    }
  ]
}

CRITICAL:
- Mantén la MISMA VERDAD fundamental del ángulo base
- Usa VOC literal del avatar: {{vocDictionary}}
- Cada variación debe sentirse diferente tonalmente pero comunicar la misma solución
- Mínimo 80 palabras en "opening_hook" para cada variación
`
};

export class AngleVariationOrchestrator {
    constructor(private productId: string, private storeId: string) { }

    async generateAngleVariations(params: {
        baseAngle: any;
        avatarJson: any;
        vocDictionary: string[];
        variationType?: 'DIRECT' | 'STORY' | 'HYBRID' | 'CONTRARIAN' | 'IDENTITY' | 'ALL';
    }) {
        try {
            const prompt = ANGLE_VARIATION_PROMPTS.GENERATE_VARIATIONS
                .replace('{{baseAngle}}', JSON.stringify(params.baseAngle, null, 2))
                .replace('{{avatarJson}}', JSON.stringify(params.avatarJson, null, 2).substring(0, 5000))
                .replace('{{vocDictionary}}', JSON.stringify(params.vocDictionary, null, 2).substring(0, 3000))
                .replace('{{variationType}}', params.variationType || 'ALL');

            const result = await AiRouter.dispatch(this.storeId, 'COPYWRITING_CREATIVE' as any, prompt, { jsonSchema: true });
            const variationsData = JSON.parse(result.text);

            return {
                success: true,
                variations: variationsData.variations || []
            };

        } catch (error: any) {
            console.error('[AngleVariationOrchestrator] Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}
