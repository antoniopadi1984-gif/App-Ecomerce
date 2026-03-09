import { NextResponse } from 'next/server';
import { AiRouter } from '@/lib/ai/router';
import { TaskType } from '@/lib/ai/providers/interfaces';

export async function POST(req: Request) {
    try {
        const {
            creativeId,
            hook,
            cta,
            framework,
            avatar,
            duration,
            scenes,
            storeId,
            historicalWinners
        } = await req.json();

        const systemPrompt = `Eres un ANALISTA experto de Meta Ads especializado en anuncios de ALTO RENDIMIENTO (E-commerce).
Tu tarea es evaluar un anuncio ANTES de ser publicado y devolver un análisis estructurado en JSON.

REGLAS DE CÁLCULO (SCORE 0-100):
1. SIMILITUD (RIESGO SATURACIÓN): Si este anuncio es muy similar a los activos actuales del producto, penaliza hasta -20 puntos.
2. HISTÓRICO: Compara el hook (\${hook}), framework (\${framework}) y avatar (\${avatar}) con los ganadores históricos: \${JSON.stringify(historicalWinners)}.
3. MESSAGE MATCH: ¿El hook conecta lógicamente con la oferta/CTA (\${cta})?
4. RETENCIÓN (SCENE ANALYZER): Analiza las escenas: \${JSON.stringify(scenes)}. Detecta baches de aburrimiento o falta de ritmo.
5. CALIDAD TÉCNICA: Evaluación de formato y legibilidad (asume 1080p, 9:16).

Devuelve EXCLUSIVAMENTE un JSON con esta estructura:
{
    "score": number,
    "improvements": [
        "Punto de mejora 1",
        "Punto de mejora 2",
        "Punto de mejora 3"
    ],
    "analysis": {
        "similarity_risk": number,
        "historical_match": number,
        "retention_prediction": "string",
        "technical_check": "OK/FAIL"
    }
}`;

        const prompt = `Analiza este creativo:
ID: \${creativeId}
Hook: "\${hook}"
CTA: "\${cta}"
Framework: \${framework}
Avatar: \${avatar}
Duración: \${duration}
Escenas: \${JSON.stringify(scenes)}`;

        const response = await AiRouter.dispatch(
            storeId || 'default',
            TaskType.PERFORMANCE_ADS,
            prompt,
            {
                systemPrompt,
                model: "gemini-1.5-flash-002"
            }
        );

        let result;
        try {
            result = typeof response.text === 'string' ? JSON.parse(response.text) : response.text;
        } catch (e) {
            const match = response.text.match(/\{[\s\S]*\}/);
            if (match) {
                result = JSON.parse(match[0]);
            } else {
                throw new Error("Failed to parse Score JSON");
            }
        }

        return NextResponse.json(result);

    } catch (error) {
        console.error('Error calculating Pre-Launch Score:', error);
        return NextResponse.json({
            score: 0,
            improvements: ["Error al conectar con el motor de análisis IA. Reintenta."],
            error: true
        }, { status: 500 });
    }
}
