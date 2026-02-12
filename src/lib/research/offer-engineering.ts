import { AiRouter } from '../ai/router';
import { prisma } from '../prisma';

/**
 * HORMOZI OFFER ENGINEERING PROMPTS
 * Based on $100M Offers framework by Alex Hormozi
 */
export const OFFER_ENGINEERING_PROMPTS = {
    GRAND_SLAM_OFFER_STACKS: `
Actúa como Alex Hormozi (autor de $100M Offers).

MISIÓN: Crear 3 offer stacks tan irresistibles que el cliente se sienta estúpido diciendo que no.

PRODUCTO: {{productTitle}}
PRECIO BASE: {{basePrice}}€
COSTO REAL: {{unitCost}}€
AVATAR PRINCIPAL: {{avatarJson}}
PAIN STACK: {{painStack}}
DESIRE STACK: {{desireStack}}

═══════════════════════════════════════════════════════════════
FRAMEWORKS HORMOZI
═══════════════════════════════════════════════════════════════

1. VALUE EQUATION:
   Value = (Dream Outcome × Perceived Likelihood of Achievement) / (Time Delay × Effort & Sacrifice)

2. OFFER STACK FORMULA:
   Main Product + High-Value Bonuses + Scarcity + Risk Reversal = Irresistible Offer

3. PRICING PSYCHOLOGY:
   - Perceived Value debe ser 3-10x el precio
   - Bonuses digitales = $0 cost, high perceived value
   - Stack ascendente: bueno → mejor → best

═══════════════════════════════════════════════════════════════
TIPOS DE OFFER STACKS
═══════════════════════════════════════════════════════════════

**1+1 STACK** (Compra 1 lleva 2):
- Percibido: 2x value
- Costo real: +10-20%
- Trigger: Scarcity ("Solo primeras 100 unidades")

**BUNDLE STACK** (Producto + Bonuses):
- Main Product
- Bonus #1: Masterclass Digital (€97 value, €0 cost)
- Bonus #2: Guía PDF Premium (€47 value, €0 cost)
- Bonus #3: Comunidad VIP 30 días (€197 value, €2/mes cost)

**UPGRADE LADDER** (Good → Better → Best):
- Tier 1: Base (€X)
- Tier 2: Premium (+€Y, bonus A+B)
- Tier 3: VIP (+€Z, bonus A+B+C+Support)

═══════════════════════════════════════════════════════════════
SALIDA JSON
═══════════════════════════════════════════════════════════════

Genera 3 offer stacks (uno de cada tipo). Para cada uno:

{
  "offers": [
    {
      "name": "La Transformación Completa",
      "type": "BUNDLE",
      "headline": "Headline irresistible tipo Hormozi",
      "components": [
        {
          "item": "{{productTitle}} (Producto Principal)",
          "perceived_value": {{basePrice}} × 1.5,
          "real_cost": {{unitCost}},
          "urgency_trigger": "Solo primeras 50 unidades"
        },
        {
          "item": "Masterclass: 'Cómo Maximizar Resultados en 7 Días'",
          "perceived_value": 97,
          "real_cost": 0,
          "psychological_trigger": "Authority + Education"
        },
        {
          "item": "Guía PDF: 'Los 21 Errores Fatales a Evitar'",
          "perceived_value": 47,
          "real_cost": 0,
          "psychological_trigger": "Fear of Loss"
        },
        {
          "item": "30 Días Acceso Comunidad VIP",
          "perceived_value": 197,
          "real_cost": 2,
          "psychological_trigger": "Social Proof + FOMO"
        }
      ],
      "pricing": {
        "total_perceived_value": 400,
        "pvp": {{basePrice}} × 1.3,
        "real_total_cost": {{unitCost}} + 2,
        "value_to_price_ratio": 4.5,
        "margin_impact": "+15% vs solo producto"
      },
      "psychological_hooks": [
        "Scarcity: Solo 50 unidades con bonuses",
        "Social Proof: '2,847 clientes ya transformaron su vida'",
        "Authority: Masterclass exclusiva",
        "Risk Reversal: Garantía 60 días o 100% reembolso"
      ],
      "risk_reversal": {
        "type": "Money-back guarantee",
        "duration": "60 días",
        "conditions": "Sin preguntas, reembolso completo",
        "psychological_impact": "Elimina fricción de compra"
      },
      "expected_metrics": {
        "aov_boost": "+120%",
        "conversion_lift": "+35-50%",
        "perceived_value_increase": "+300%"
      },
      "copywriting_angle": "No es solo {{productTitle}}... es el sistema completo que garantiza resultados en 7 días o devolvemos tu dinero"
    }
  ]
}

CRITICAL: 
- Real cost NUNCA supera {{unitCost}} + €5
- Perceived value mínimo 3x el PVP
- Bonuses deben ser ESPECÍFICOS al pain/desire del avatar
- USA lenguaje literal del avatar ({{vocDictionary}})
  `,

    COPY_VARIATIONS_V3: `
Actúa como Eugene Schwartz + Gary Halbert + Alex Hormozi.

MISIÓN: Generar 5 variaciones de {{copyType}} para el mismo avatar/ángulo, con diferentes niveles de sofisticación.

AVATAR: {{avatarJson}}
ANGLE: {{angleJson}}
OFFER: {{offerJson}}
VOC DICTIONARY: {{vocDictionary}}
COPY TYPE: {{copyType}}

═══════════════════════════════════════════════════════════════
REGLAS
═══════════════════════════════════════════════════════════════

1. MISMA VERDAD: Todas las variaciones comunican la misma verdad fundamental
2. VOC LITERAL: Usa frases EXACTAS del diccionario VOC del avatar
3. SOPHISTICATION LADDER: Genera desde L1 (simple) hasta L5 (ultra-sofisticado)
4. EMOTIONAL ESCALATION: Intensidad emocional variable

═══════════════════════════════════════════════════════════════
TIPOS DE COPY
═══════════════════════════════════════════════════════════════

**HEADLINE** (40-80 caracteres):
- Variación 1: Directo (Schwartz L1-L2)
- Variación 2: Curioso (Schwartz L3)
- Variación 3: Mecanismo (Schwartz L4)
- Variación 4: Identidad (Schwartz L5)
- Variación 5: Contrarian (Galbert style)

**VSL_OPENING** (Primeros 15 segundos):
- Hook + Agitación + Promise

**CTA** (Call to Action):
- Variación baja presión → alta presión

**BULLETS** (Beneficios):
- Formato: Beneficio + Mecanismo + Prueba

═══════════════════════════════════════════════════════════════
SALIDA JSON
═══════════════════════════════════════════════════════════════

{
  "variations": [
    {
      "text": "El copy exacto",
      "sophistication_level": 1-5,
      "emotional_intensity": 1-10,
      "voc_phrases_used": ["frase literal del avatar", "otra frase"],
      "psychological_hook": "Scarcity" | "Authority" | "Social Proof" | "Fear" | "Desire",
      "use_case": "Para tráfico frío Awareness 1-2" | "Para remarketing Awareness 4-5"
    }
  ]
}
`
};

export class OfferEngineeringOrchestrator {
    constructor(private productId: string, private storeId: string) { }

    async generateOfferStacks(params: {
        basePrice: number;
        unitCost: number;
        avatarJson: any;
        painStack: any[];
        desireStack: any[];
        strategy?: '1+1' | 'BUNDLE' | 'UPGRADE' | 'ALL';
    }) {
        try {
            const product = await import('@/lib/prisma').then(m => m.prisma.product.findUnique({
                where: { id: this.productId }
            }));

            if (!product) throw new Error('Product not found');

            const prompt = OFFER_ENGINEERING_PROMPTS.GRAND_SLAM_OFFER_STACKS
                .replace('{{productTitle}}', product.title)
                .replace('{{basePrice}}', String(params.basePrice))
                .replace('{{unitCost}}', String(params.unitCost))
                .replace('{{avatarJson}}', JSON.stringify(params.avatarJson, null, 2))
                .replace('{{painStack}}', JSON.stringify(params.painStack, null, 2).substring(0, 3000))
                .replace('{{desireStack}}', JSON.stringify(params.desireStack, null, 2).substring(0, 3000));

            const result = await AiRouter.dispatch(this.storeId, 'COPYWRITING_CREATIVE' as any, prompt, { jsonSchema: true });
            const offersData = JSON.parse(result.text);

            return {
                success: true,
                offers: offersData.offers || []
            };

        } catch (error: any) {
            console.error('[OfferEngineeringOrchestrator] Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async generateCopyVariations(params: {
        copyType: 'HEADLINE' | 'VSL_OPENING' | 'CTA' | 'BULLETS';
        avatarJson: any;
        angleJson: any;
        offerJson?: any;
        vocDictionary: string[];
    }) {
        try {
            const prompt = OFFER_ENGINEERING_PROMPTS.COPY_VARIATIONS_V3
                .replace('{{copyType}}', params.copyType)
                .replace('{{avatarJson}}', JSON.stringify(params.avatarJson, null, 2).substring(0, 5000))
                .replace('{{angleJson}}', JSON.stringify(params.angleJson, null, 2).substring(0, 3000))
                .replace('{{offerJson}}', JSON.stringify(params.offerJson || {}, null, 2).substring(0, 2000))
                .replace('{{vocDictionary}}', JSON.stringify(params.vocDictionary, null, 2).substring(0, 5000));

            const result = await AiRouter.dispatch(this.storeId, 'COPYWRITING_CREATIVE' as any, prompt, { jsonSchema: true });
            const variationsData = JSON.parse(result.text);

            return {
                success: true,
                variations: variationsData.variations || []
            };

        } catch (error: any) {
            console.error('[OfferEngineeringOrchestrator.generateCopyVariations] Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}
