import { NextRequest, NextResponse } from 'next/server';
import { AiRouter } from '@/lib/ai/router';
import { TaskType } from '@/lib/ai/providers/interfaces';

export async function POST(req: NextRequest) {
    try {
        const { storeId, conceptId, conceptName, types, amount, phase, aggressiveness } = await req.json();

        if (!storeId || !conceptName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // En un escenario real, aquí buscaríamos el Research Core del producto/avatar
        // Para este MVP, usaremos un contexto genérico potente
        const context = `
Concepto Activo: ${conceptName}
Fase del Embudo: ${phase}
Nivel de Agresividad: ${aggressiveness}/10
Tipos de Hook Solicitados: ${types.join(', ')}
Cantidad: ${amount}
`;

        const systemPrompt = `
Eres un experto en direct response con metodología IA Pawliw.
Tu trabajo es generar hooks que interrumpan el scroll, creen tensión psicológica y fuercen el primer segundo de atención.

Cada hook debe:
- Tener menos de 10 palabras.
- Contener una promesa o provocación clara.
- Estar calibrado para la fase [${phase}].
- Estar alineado con el concepto [${conceptName}].

Devuelve SOLO un array JSON con objetos que tengan las propiedades "text" y "type" (uno de los tipos solicitados).
MHO: No incluyas explicaciones ni formato markdown fuera del JSON.
`;

        const prompt = `Genera ${amount} hooks para el concepto "${conceptName}" en fase ${phase}. Tipos: ${types.join(', ')}.`;

        const response = await AiRouter.dispatch(storeId, TaskType.COPYWRITING_DEEP, prompt, {
            systemPrompt,
            context,
            jsonSchema: {
                type: "object",
                properties: {
                    hooks: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                text: { type: "string" },
                                type: { type: "string" }
                            },
                            required: ["text", "type"]
                        }
                    }
                },
                required: ["hooks"]
            },
            model: process.env.GEMINI_MODEL_PRODUCTION || 'gemini-2.5-pro' // Modelo desde env
        });

        // Intentar parsear el JSON si viene como texto
        let result;
        try {
            result = typeof response.text === 'string' ? JSON.parse(response.text) : response.text;
        } catch (e) {
            // Fallback si el modelo no devolvió JSON limpio
            const match = response.text.match(/\[[\s\S]*\]/);
            if (match) {
                result = { hooks: JSON.parse(match[0]) };
            } else {
                throw new Error("Failed to parse AI response as JSON");
            }
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('[API Hooks] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
