import { prisma } from '@/lib/prisma';

import type { VideoAdConfig } from '../orchestrators/video-ad-orchestrator';

type GenerateOptions = {
    mode?: 'auto' | 'ugc' | 'vsl' | 'broll' | 'lipsync';
    avatarStyle?: string;
    format?: string;
    storeId?: string;
    customScript?: string;
};

export class ResearchLabConnector {

    // ── SCRIPT VIA CLAUDE ──────────────────────────────────────────────────
    static async buildScriptWithClaude(
        angle: any,
        avatar: any,
        mode: string,
        productTitle: string
    ): Promise<string> {
        try {
            const avatarDesc = `${avatar.gender || 'persona'}, ${avatar.age || '35'} años, ${avatar.occupation || 'profesional'}`;
            const angleText = angle.angle || angle.concept || '';
            const hook = angle.hooks?.[0]?.text || angle.hooks?.[0] || angle.lead_lines || '';
            const pain = angle.painPoints?.[0]?.text || angle.painPoints?.[0] || '';
            const benefit = angle.benefits?.[0]?.text || angle.benefits?.[0] || '';

            const modeInstructions: Record<string, string> = {
                ugc: 'Escribe como si fuera una persona real compartiendo su experiencia auténtica. Tono conversacional, primera persona, 30-45 segundos hablado (~75-100 palabras).',
                vsl: 'Video Sales Letter. Estructura: Hook fuerte → Problema → Agitación → Solución → Beneficios → CTA. 60-90 segundos (~150-200 palabras).',
                broll: 'Voz en off corta y poderosa para acompañar imágenes del producto. 15-20 segundos (~35-45 palabras). Sin referencias al hablante.',
                lipsync: 'Script para lipsync con avatar IA. Muy natural, sin muletillas, ritmo fluido. 20-30 segundos (~50-70 palabras).',
                auto: 'Script de 30-45 segundos (~75-100 palabras). Hook en las primeras 3 palabras. Termina con CTA claro.',
            };

            const systemPrompt = `Eres un experto en copywriting de respuesta directa para ecommerce. Escribe SOLO el script, sin títulos ni explicaciones. Sin asteriscos. Solo el texto que diría el avatar.`;
            const userPrompt = `Producto: ${productTitle}\nAvatar objetivo: ${avatarDesc}\nÁngulo de marketing: ${angleText}\nHook principal: ${hook}\nPain point: ${pain}\nBeneficio clave: ${benefit}\nIdioma: Español mexicano\nFormato: ${modeInstructions[mode] || modeInstructions['auto']}`;

            const res = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.ANTHROPIC_API_KEY || '',
                    'anthropic-version': '2023-06-01',
                },
                body: JSON.stringify({
                    model: 'claude-opus-4-6',
                    max_tokens: 400,
                    system: systemPrompt,
                    messages: [{ role: 'user', content: userPrompt }]
                })
            });

            const data = await res.json();
            const text = data.content?.[0]?.text;
            return text ? text.trim() : ResearchLabConnector.buildScriptFallback(angle);

        } catch (err) {
            console.warn('[ResearchLabConnector] Claude script failed, using fallback:', err);
            return ResearchLabConnector.buildScriptFallback(angle);
        }
    }

    static buildScriptFallback(angle: any): string {
        if (angle.lead_lines) return angle.lead_lines;
        if (angle.hooks?.[0]) return angle.hooks[0].text || angle.hooks[0];
        if (angle.painPoints?.[0]) return angle.painPoints[0].text || angle.painPoints[0];
        return `${angle.concept || ''}: ${angle.angle || 'Descubre la solución que estabas buscando.'}`.trim();
    }

    // ── MAIN: CONFIGS DESDE RESEARCH ──────────────────────────────────────
    static async getVideoConfigsFromResearch(
        productId: string,
        maxVideos: number = 3,
        opts: GenerateOptions = {}
    ): Promise<VideoAdConfig[]> {
        const { mode = 'auto', avatarStyle = 'auto' } = opts;

        const run = await (prisma.researchRun as any).findFirst({
            where: { productId, status: 'READY' },
            orderBy: { createdAt: 'desc' }
        });

        if (!run) throw new Error(`No research run found for product ${productId}`);

        const results = JSON.parse(run.results || '{}');

        // Obtener producto para contexto
        const product = await (prisma.product as any).findUnique({
            where: { id: productId },
            select: { title: true }
        });
        const productTitle = product?.title || 'producto';

        // Avatares del research
        const allAvatars = (
            results.v3_avatars ||
            results.avatars?.avatars ||
            results.avatars ||
            []
        ).slice(0, 5);

        // Filtrar avatar por estilo seleccionado
        const avatars = avatarStyle === 'auto'
            ? allAvatars
            : allAvatars.filter((a: any) => {
                const age = parseInt(a.age || a.demographics?.age || '0');
                const gender = (a.gender || '').toLowerCase();
                if (avatarStyle === 'woman_40s') return gender.includes('mujer') || gender.includes('female') || gender.includes('woman') ? age >= 35 && age <= 50 : false;
                if (avatarStyle === 'woman_55s') return (gender.includes('mujer') || gender.includes('female')) && age >= 50;
                if (avatarStyle === 'man_35s') return gender.includes('hombre') || gender.includes('male') || gender.includes('man');
                if (avatarStyle === 'woman_25s') return (gender.includes('mujer') || gender.includes('female')) && age < 35;
                return true;
            });

        const finalAvatars = avatars.length > 0 ? avatars : allAvatars;

        // Ángulos del research
        const angles = (
            results.marketing_angles?.angle_tree ||
            results.angles?.angle_tree ||
            results.angles ||
            []
        ).slice(0, maxVideos);

        if (angles.length === 0) throw new Error('No angles found in research');

        // Generar scripts con Claude en paralelo (máximo maxVideos combinaciones)
        const combos = angles.slice(0, maxVideos).map((angle: any, i: number) => ({
            angle,
            avatar: finalAvatars[i % Math.max(finalAvatars.length, 1)] || {}
        }));

        const scripts = await Promise.all(
            combos.map(({ angle, avatar }: { angle: any; avatar: any }) =>
                opts.customScript
                    ? Promise.resolve(opts.customScript!)
                    : ResearchLabConnector.buildScriptWithClaude(angle, avatar, mode, productTitle)
            )
        );

        return combos.map(({ angle, avatar }: { angle: any; avatar: any }, i: number) => ({
            avatarPrompt: ResearchLabConnector.buildAvatarPrompt(avatar),
            script: scripts[i],
            concept: `${avatar.name || 'Avatar ' + (i + 1)} × ${angle.concept || angle.angle || 'Ángulo ' + (i + 1)}`,
            voiceId: ResearchLabConnector.selectVoice(avatar),
            format: opts.format || '9:16',
            mode,
        }));
    }

    // ── HELPERS ───────────────────────────────────────────────────────────
    static buildAvatarPrompt(avatar: any): string {
        const age = avatar.age || avatar.demographics?.age || '38';
        const gender = avatar.gender || 'person';
        const occupation = avatar.occupation || avatar.name || 'professional';
        const ethnicity = avatar.ethnicity || 'Latin American';
        const skin = avatar.skin || '';
        return `${ethnicity} ${gender}, ${age} years old, ${occupation}${skin ? ', ' + skin : ''}, candid authentic expression, looking directly at camera, soft natural lighting, iPhone portrait quality, UGC style, real person not a model`;
    }

    static selectVoice(avatar: any): string | undefined {
        const gender = (avatar.gender || '').toLowerCase();
        if (gender.includes('male') || gender.includes('hombre') || gender.includes('man')) {
            return process.env.ELEVENLABS_VOICE_MALE;
        }
        return process.env.ELEVENLABS_VOICE_FEMALE;
    }

    static getTestConfigs(): VideoAdConfig[] {
        return [
            {
                avatarPrompt: 'Latin American woman, 38 years old, professional, friendly smile, looking at camera, natural lighting, UGC style',
                script: '¿Sabías que el 80% de las personas no duermen bien? Yo tampoco podía... hasta que encontré esto.',
                concept: 'Test — Mujer profesional × Pain point sueño',
                voiceId: process.env.ELEVENLABS_VOICE_FEMALE,
            },
            {
                avatarPrompt: 'Latin American man, 45 years old, executive, confident, professional attire, direct camera gaze',
                script: 'Tu cerebro merece lo mejor. Sin estimulantes. Sin rebote. Solo resultados reales.',
                concept: 'Test — Hombre ejecutivo × Beneficios',
                voiceId: process.env.ELEVENLABS_VOICE_MALE,
            },
        ];
    }
}
