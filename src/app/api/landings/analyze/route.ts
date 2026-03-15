import { NextRequest, NextResponse } from 'next/server';
import { AiRouter } from '@/lib/ai/router';
import { TaskType } from '@/lib/ai/providers/interfaces';
import { DEFAULT_AGENT_PROMPTS } from '@/lib/ai/defaults/agent-prompts';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
    const { url, productId, storeId } = await req.json();
    if (!url || !storeId) return NextResponse.json({ error: 'url y storeId requeridos' }, { status: 400 });

    // 1. Fetch de la landing — sin bot UA
    const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(10000)
    });
    const html = await res.text();

    // 2. Extraer texto limpio
    const cleanText = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .slice(0, 8000);

    // 3. Análisis forense con CREATIVE_FORENSIC
    const analysis = await AiRouter.dispatch(
        storeId,
        TaskType.RESEARCH_FORENSIC,
        `${DEFAULT_AGENT_PROMPTS.CREATIVE_FORENSIC}

LANDING A ANALIZAR:
URL: ${url}
CONTENIDO: ${cleanText}

Aplica análisis forense completo de 10 niveles. Devuelve JSON con:
{
  "headline": "",
  "subheadline": "",
  "mechanism": "",
  "offer": "",
  "guarantee": "",
  "ctas": [],
  "socialProof": [],
  "emotionalTriggers": [],
  "schwartz_level": 1-5,
  "hooks": [],
  "weaknesses": [],
  "strengths": [],
  "overallScore": 1-10,
  "spencerConcept": "C1-C9",
  "recommendedAngles": []
}`,
        { jsonSchema: true }
    );

    let analysisData: any = {};
    try {
        const clean = analysis.text.replace(/```json\s*/g, '').replace(/```/g, '').trim();
        analysisData = JSON.parse(clean);
    } catch {
        analysisData = { raw: analysis.text };
    }

    return NextResponse.json({
        ok: true,
        url,
        html: html.slice(0, 50000), // HTML completo para clonar
        analysis: analysisData
    });
}
