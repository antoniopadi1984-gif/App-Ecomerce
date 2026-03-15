import { NextRequest, NextResponse } from 'next/server';
import { AiRouter } from '@/lib/ai/router';
import { TaskType } from '@/lib/ai/providers/interfaces';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { videoUrl, type, productId, storeId } = body;

        if (!videoUrl) return NextResponse.json({ error: 'videoUrl is required' }, { status: 400 });

        // For analyze we prefer Gemini 2.0 Flash or 1.5 Pro
        // Prompt for Gemini Vision analyzing video
        const prompt = `
            Actúa como un Director Creativo Senior y Media Buyer Experto.
            Analiza este video de marketing (${type === 'competencia' ? 'de un competidor' : 'propio'}) 
            y extrae una disección forense siguiendo la metodología PEC.

            REGLAS DE SALIDA (JSON OBLIGATORIO):
            {
              "duracion": número,
              "hook": { "tipo": string, "texto": string, "duracion_segundos": número },
              "estructura": ["hook", "problema", "mecanismo", "oferta", "cta"],
              "framework": "AIDA" | "PAS" | "STORY" | "DR" | "MECH_REVEAL",
              "fase_embudo": "frio" | "templado" | "caliente" | "retargeting" | "oferta",
              "formato": "9x16" | "1x1" | "16x9",
              "ritmo_cortes_por_segundo": número,
              "emocion_musica": string,
              "subtitulos": boolean,
              "puntuacion_retencion": número (0-100),
              "puntuacion_conversion": número (0-100),
              "sugerencias": [string],
              "tomas": [{ "inicio": número, "fin": número, "descripcion": string, "tipo": string }]
            }
        `;

        // We fetch the video content if it's a URL, or expect it to be passed differently.
        // For simplicity in this demo, we assume videoUrl is a Base64 or we fetch it.
        // If it's a Drive URL, we'd need to fetch bytes.

        let videoBase64 = "";
        if (videoUrl.startsWith('data:')) {
            videoBase64 = videoUrl;
        } else {
            // Fetch video bytes
            const resp = await fetch(videoUrl);
            const buffer = await resp.arrayBuffer();
            videoBase64 = Buffer.from(buffer).toString('base64');
        }

        const aiResponse = await AiRouter.dispatch(
            storeId || 'default',
            TaskType.VIDEO_DISSECTION,
            prompt,
            {
                model: 'gemini-3.1-flash-lite-preview',
                video: videoBase64,
                videoMimeType: 'video/mp4',
                jsonSchema: true
            }
        );

        return NextResponse.json(JSON.parse(aiResponse.text));

    } catch (error: any) {
        console.error('[VideoLab/Analyze] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
