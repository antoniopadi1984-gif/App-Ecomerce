import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
    try {
        const { productId, mode = 'ugc', framework = 'hook_body_cta', targetDuration = 30, voiceId, avatarId, angleId, customScript } = await req.json();
        if (!productId) return NextResponse.json({ error: 'productId requerido' }, { status: 400 });

        const [p2Step, p21Step, p3Step, product] = await Promise.all([
            (prisma.researchStep as any).findFirst({ where: { productId, stepKey: 'P2' }, orderBy: { createdAt: 'desc' } }),
            (prisma.researchStep as any).findFirst({ where: { productId, stepKey: 'P21' }, orderBy: { createdAt: 'desc' } }),
            (prisma.researchStep as any).findFirst({ where: { productId, stepKey: 'P3' }, orderBy: { createdAt: 'desc' } }),
            (prisma.product as any).findUnique({ where: { id: productId }, select: { title: true, imageUrl: true, description: true } }),
        ]);

        const p2 = p2Step?.outputJson ? JSON.parse(p2Step.outputJson) : {};
        const p21 = p21Step?.outputJson ? JSON.parse(p21Step.outputJson) : {};
        const p3Raw = p3Step?.outputJson ? JSON.parse(p3Step.outputJson) : {};

        let p3: any = {};
        if (p3Raw?.raw) {
            try { p3 = JSON.parse(p3Raw.raw.replace(/```json\n?/g, '').replace(/```/g, '').trim()); } catch {}
        } else if (p3Raw) { p3 = p3Raw; }

        const avatars = p2?.avatars || [];
        const avatar = avatarId ? avatars.find((a: any) => a.id === avatarId) : avatars[0];
        const langBank = (p21?.language_bank || []).find((lb: any) => lb.avatar_id === avatar?.id) || {};
        const painPhrases = (langBank?.vocabulary_clusters?.pain_phrases || []).slice(0, 4).join(' / ');
        const hopePhrases = (langBank?.vocabulary_clusters?.hope_phrases || []).slice(0, 3).join(' / ');
        const jargon = (langBank?.vocabulary_clusters?.jargon || []).slice(0, 5).join(', ');
        const angles = p3?.angles || p3?.angle_tree || (p3?.blockingBeliefs || []).map((b: any, i: number) => ({ concept: `Creencia ${i+1}`, angle: b.belief, hook: b.whyItBlocks }));
        const angle = angleId !== undefined ? angles[parseInt(angleId)] : angles[0];

        const numScenes = Math.ceil(targetDuration / 5);
        const productTitle = product?.title || 'producto';
        const productImg = product?.imageUrl || '';

        const frameworkInstructions: Record<string, string> = {
            hook_body_cta: `ESTRUCTURA Hook-Body-CTA: Escena 1 = Hook brutal (patrón interrupt). Escenas 2-${numScenes-2} = Cuerpo (problema→agitación→solución→mecanismo→prueba). Escena ${numScenes-1} = Resultado/Transformación. Escena ${numScenes} = CTA urgente.`,
            aida: `ESTRUCTURA AIDA: Escenas 1-2 = Atención (hook visual + verbal). Escenas 3-4 = Interés (problema + solución única). Escenas 5-6 = Deseo (beneficios + prueba social). Escena ${numScenes} = Acción (CTA).`,
            pas: `ESTRUCTURA PAS: Escenas 1-2 = Pain (mostrar el dolor exacto del avatar). Escenas 3-4 = Agitate (empeorar el problema, consecuencias). Escenas 5-${numScenes-1} = Solve (la solución, cómo funciona). Escena ${numScenes} = CTA.`,
            dac: `ESTRUCTURA DIC: Escena 1 = Disrupt (romper el patrón mental). Escenas 2-${numScenes-2} = Intrigue (revelar el mecanismo, generar curiosidad). Escenas ${numScenes-1}-${numScenes} = Click (CTA irresistible).`,
            bab: `ESTRUCTURA BAB: Escenas 1-2 = Before (vida actual con el problema). Escenas 3-${numScenes-2} = After (visualización de la transformación). Escenas ${numScenes-1}-${numScenes} = Bridge (el producto como puente) + CTA.`,
            storybrand: `ESTRUCTURA StoryBrand: Escena 1 = El héroe (avatar) tiene un problema. Escena 2 = El guía aparece (marca). Escenas 3-4 = El plan (cómo funciona). Escena 5 = Llamada a la acción. Escena 6 = Éxito. Escena 7 = Evitar el fracaso.`,
            hormozi: `ESTRUCTURA Hormozi Offer: Escena 1 = El problema costoso. Escena 2 = Por qué las soluciones actuales fallan. Escenas 3-4 = La oferta irresistible (valor/precio). Escena 5 = Garantía. Escena ${numScenes} = CTA con urgencia.`,
        };

        const modeInstructions: Record<string, string> = {
            ugc: 'Formato UGC: avatar hablando a cámara, primera persona, lenguaje conversacional auténtico, como si fuera un testimonial real.',
            vsl: 'Formato VSL: narración persuasiva estructurada, mezcla de talking head con b-roll del producto, voz autoridad.',
            broll: 'Formato B-Roll: solo voz en off, sin cara del avatar. Escenas visuales del producto y situaciones.',
            voiceover: 'Formato Voz en Off: narrador externo, no primera persona. Escenas cinematográficas.',
            testimonial: 'Formato Testimonial: historia personal real, emocional, antes/después desde la perspectiva del avatar.',
            problem_solution: 'Formato Problema/Solución: primera mitad muestra el problema vívidamente, segunda mitad la solución.',
        };

        const replicateToken = process.env.REPLICATE_API_TOKEN;
        const createRes = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${replicateToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'anthropic/claude-sonnet-4-6',
                input: {
                    system_prompt: 'Eres el mejor director creativo y copywriter de Meta Ads. Creas guiones de video divididos en escenas de 5 segundos. RESPONDE SOLO JSON VÁLIDO, sin markdown, sin explicaciones.',
                    prompt: `PRODUCTO: ${productTitle}
IMAGEN: ${productImg}
AVATAR: ${avatar?.name || 'persona'}, ${avatar?.age || ''}años, ${avatar?.occupation || ''}, ${avatar?.location || ''}
BIO: ${(avatar?.biography || '').slice(0, 250)}
TRIGGER: ${avatar?.trigger_experience || ''}
DESEO: ${avatar?.core_desire || ''}
ÁNGULO: ${angle?.concept || ''} — ${angle?.angle || angle?.belief || ''}
HOOK: ${angle?.hook || angle?.lead_lines || ''}
FRASES REALES: Pain: ${painPhrases} | Hope: ${hopePhrases} | Jerga: ${jargon}
FORMATO: ${modeInstructions[mode] || modeInstructions.ugc}
${frameworkInstructions[framework] || frameworkInstructions.hook_body_cta}
DURACIÓN TOTAL: ${targetDuration} segundos = ${numScenes} escenas de 5s cada una
${customScript ? 'GUION BASE: ' + customScript : ''}

DESCRIPCIÓN FÍSICA DEL AVATAR para generar imagen IA (detallada, en inglés):
- Mujer latina ${avatar?.age || '29'} años, ${avatar?.occupation || 'profesional'}, Ciudad de México
- Aspecto auténtico UGC, no modelo, expresión genuina
- Iluminación natural suave, fondo hogar moderno o oficina
- ${avatar?.biography?.slice(0, 100) || ''}

Genera exactamente ${numScenes} escenas. JSON:
{
  "title": "título del video",
  "totalDuration": ${targetDuration},
  "format": "${mode}",
  "framework": "${framework}",
  "avatarDescription": "descripción física detallada en inglés para Flux/imagen IA",
  "avatarImageUrl": null,
  "scenes": [
    {
      "id": 1,
      "duration": 5,
      "spokenText": "texto exacto hablado por el avatar en español mexicano",
      "visualPrompt": "cinematic description in English for Kling/video AI model, specific camera angle, lighting, action",
      "sceneType": "talking_head|product_demo|broll|lipsync|text_overlay",
      "cameraAngle": "close_up|medium|wide|extreme_close_up|overhead",
      "emotion": "worried|confident|surprised|happy|neutral|relieved|excited",
      "includeProduct": true,
      "productAction": "holding|applying|showing_results|unboxing|null",
      "transitionOut": "cut|fade|dissolve"
    }
  ]
}`
                }
            })
        });

        const predData = await createRes.json();
        if (!createRes.ok) throw new Error(`Replicate ${createRes.status}: ${JSON.stringify(predData)}`);
        
        // Polling hasta completar
        const predId = predData.id;
        let rawText = '';
        const start = Date.now();
        while (Date.now() - start < 55000) {
            await new Promise(r => setTimeout(r, 3000));
            const poll = await fetch(`https://api.replicate.com/v1/predictions/${predId}`, {
                headers: { 'Authorization': `Bearer ${replicateToken}` }
            });
            const pollData = await poll.json();
            if (pollData.status === 'succeeded') {
                const out = pollData.output;
                rawText = Array.isArray(out) ? out.join('') : (out || '');
                break;
            }
            if (pollData.status === 'failed') throw new Error(`Claude falló: ${pollData.error}`);
        }

        let sceneScript: any;
        try {
            const cleaned = rawText.replace(/```json\n?/g, '').replace(/```/g, '').trim();
            sceneScript = JSON.parse(cleaned);
        } catch {
            return NextResponse.json({ error: 'Error parseando guion de Claude', raw: rawText.slice(0, 500) }, { status: 500 });
        }

        return NextResponse.json({ success: true, script: sceneScript, avatar, angle, productTitle, productImageUrl: productImg, voiceId });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
