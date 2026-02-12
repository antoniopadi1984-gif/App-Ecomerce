import { prisma } from '../prisma';
import { AiRouter } from '../ai/router';
import { TaskType } from '../ai/providers/interfaces';

/**
 * Offer Engineering V2 - Hormozi Framework
 * Genera 5 offer stacks automáticamente
 */

export interface OfferStackParams {
    productId: string;
    basePrice: number;
    unitCost?: number;
    targetMargin?: number; // %
    productName?: string;
    productDescription?: string;
}

export interface OfferComponent {
    item: string;
    value: number;
    description: string;
}

export interface GeneratedOfferStack {
    name: string;
    strategy: '1+1' | 'BUNDLE' | 'UPGRADE';
    components: OfferComponent[];
    totalValue: number;
    price: number;
    discount: number; // %
    perceivedValue: string;
    urgency?: string;
    guarantee?: string;
}

export class OfferEngineeringV2 {
    /**
     * Genera 5 offer stacks usando Hormozi framework
     */
    static async generateStacks(params: OfferStackParams): Promise<GeneratedOfferStack[]> {
        console.log('[OfferEngineering] Generating stacks for:', params.productId);

        const prompt = `Eres un experto en Offer Engineering (Alex Hormozi framework).

PRODUCTO:
- Nombre: ${params.productName || 'No especificado'}
- Descripción: ${params.productDescription || 'No especificado'}
- Precio base: €${params.basePrice}
- Costo unitario: €${params.unitCost || 'No especificado'}
- Margen objetivo: ${params.targetMargin || 60}%

TAREA:
Crea 5 offer stacks irresistibles usando el framework de Hormozi:

ESTRATEGIAS A USAR:
1. **1+1 Stack** - 2x producto + bonus
2. **Bundle Stack** - Producto + complementos
3. **Upgrade Stack** - Versión premium
4. **Value Ladder** - Tier intermedio
5. **Subscription Stack** - Modelo recurring

PARA CADA STACK, INCLUYE:
- name: Nombre atractivo
- strategy: '1+1' | 'BUNDLE' | 'UPGRADE'
- components: Array de componentes con:
  - item: Nombre del componente
  - value: Valor percibido (€)
  - description: Qué es
- totalValue: Suma de valores (€)
- price: Precio final (€)
- discount: % de descuento
- perceivedValue: Frase de valor ("€150 en ahorro")
- urgency: Frase de urgencia (opcional)
- guarantee: Garantía (opcional)

REGLAS CRÍTICAS:
- Total value debe ser 2-4x el precio
- Precio debe respetar margen objetivo
- Componentes deben ser tangibles o digitales
- Nombres deben ser memorables
- Cada stack debe tener mínimo 3 componentes

Responde SOLO con JSON array:
[
  {
    "name": "...",
    "strategy": "1+1",
    "components": [...],
    "totalValue": 200,
    "price": 89,
    "discount": 55,
    "perceivedValue": "€111 en ahorro",
    "urgency": "Solo 50 stacks disponibles",
    "guarantee": "30 días garantía"
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
            const jsonMatch = result.text.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error('No valid JSON found in response');
            }

            const stacks: GeneratedOfferStack[] = JSON.parse(jsonMatch[0]);

            console.log(`[OfferEngineering] ✅ Generated ${stacks.length} stacks`);

            return stacks;

        } catch (e) {
            console.error('[OfferEngineering] Parse error:', e);
            throw new Error('Failed to parse offer stacks');
        }
    }

    /**
     * Genera y guarda en DB
     */
    static async generateAndSave(params: OfferStackParams) {
        const stacks = await this.generateStacks(params);

        // Save to DB
        const savedStacks: any[] = [];
        for (const stack of stacks) {
            const savedStack = await (prisma as any).offerStack.create({
                data: {
                    productId: params.productId,
                    name: stack.name,
                    strategy: stack.strategy,
                    components: JSON.stringify(stack.components),
                    totalValue: stack.totalValue,
                    price: stack.price,
                    discount: stack.discount
                }
            });
            savedStacks.push(savedStack);
        }

        console.log(`[OfferEngineering] 💾 Saved ${savedStacks.length} stacks to DB`);

        return savedStacks;
    }

    /**
     * Get saved stacks for product
     */
    static async getStacks(productId: string) {
        return await (prisma as any).offerStack.findMany({
            where: { productId },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Calculate best performing stack
     */
    static calculateBestStack(stacks: GeneratedOfferStack[], criteria: 'margin' | 'value' | 'discount' = 'value') {
        if (stacks.length === 0) return null;

        switch (criteria) {
            case 'margin':
                return stacks.sort((a, b) =>
                    ((b.price / b.totalValue) - (a.price / a.totalValue))
                )[0];

            case 'discount':
                return stacks.sort((a, b) => b.discount - a.discount)[0];

            case 'value':
            default:
                return stacks.sort((a, b) => b.totalValue - a.totalValue)[0];
        }
    }
}
