import { NextRequest, NextResponse } from 'next/server';
import { AiRouter } from '@/lib/ai/router';
import { TaskType } from '@/lib/ai/providers/interfaces';

export async function POST(req: NextRequest) {
    try {
        const { hook, avatar, concept, offer, format, duration, storeId } = await req.json();

        const systemPrompt = `
Eres un Director Creativo experto en Video Ads de Respuesta Directa con metodología IA Pro.
Tu misión es expandir un GANCHO (hook) en un guion completo de vídeo optimizado para conversión.

DATOS DEL PROYECTO:
- CONCEPTO: ${concept}
- OFERTA: ${offer}
- FORMATO: ${format}
- DURACIÓN OBJETIVO: ${duration}
- AVATAR: ${avatar}

REGLAS ESTRICTAS:
1. Divide el guion en escenas lógicas.
2. El "dialogo" debe ser natural, como si lo dijera una persona real (UGC).
3. "visual" describe lo que se ve.
4. "prompt_video" es una instrucción en inglés para un modelo de generación de vídeo (como Kling o VideoFX).
5. "broll_necesario" es true si no sale el avatar hablando.
6. El "script_master" es el texto completo para el narrador, incluyendo pausas naturales.

Devuelve EXCLUSIVAMENTE un JSON con esta estructura:
{
  "escenas": [
    {
      "numero": 1,
      "tipo": "HOOK | PROBLEMA | MECANISMO | PRUEBA | OFERTA | CTA",
      "duracion_segundos": number,
      "dialogo": "texto",
      "visual": "descripción",
      "tipo_plano": "PRIMER_PLANO | PLANO_MEDIO | PLANO_GENERAL | DETALLE",
      "emocion": "urgencia | curiosidad | confianza | sorpresa",
      "broll_necesario": boolean,
      "descripcion_broll": "descripción para B-Roll",
      "prompt_video": "prompt en inglés"
    }
  ],
  "script_master": "texto completo",
  "duracion_total_estimada": number,
  "framework": "PAS | AIDA | SPENCER"
}
`;

        const prompt = `Genera un guion de video ads basado en este hook: "${hook}". El video debe presentar la oferta "${offer}" y durar aproximadamente ${duration}.`;

        const response = await AiRouter.dispatch(storeId, TaskType.COPYWRITING_DEEP, prompt, {
            systemPrompt,
            jsonSchema: {
                type: "object",
                properties: {
                    escenas: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                numero: { type: "number" },
                                tipo: { type: "string" },
                                duracion_segundos: { type: "number" },
                                dialogo: { type: "string" },
                                visual: { type: "string" },
                                tipo_plano: { type: "string" },
                                emocion: { type: "string" },
                                broll_necesario: { type: "boolean" },
                                descripcion_broll: { type: "string" },
                                prompt_video: { type: "string" }
                            },
                            required: ["numero", "tipo", "duracion_segundos", "dialogo", "visual", "tipo_plano", "emocion", "broll_necesario", "prompt_video"]
                        }
                    },
                    script_master: { type: "string" },
                    duracion_total_estimada: { type: "number" },
                    framework: { type: "string" }
                },
                required: ["escenas", "script_master", "duracion_total_estimada", "framework"]
            },
            model: "gemini-1.5-pro-002"
        });

        let result;
        try {
            result = typeof response.text === 'string' ? JSON.parse(response.text) : response.text;
        } catch (e) {
            const match = response.text.match(/\[[\s\S]*\]/);
            if (match) {
                result = JSON.parse(match[0]);
            } else {
                throw new Error("Failed to parse script JSON");
            }
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('[API Video Script] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
