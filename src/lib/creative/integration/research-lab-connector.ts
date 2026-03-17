import { prisma } from '@/lib/prisma';

import type { VideoAdConfig } from '../orchestrators/video-ad-orchestrator';

type GenerateOptions = {
    mode?: 'auto' | 'ugc' | 'vsl' | 'broll' | 'lipsync';
    avatarStyle?: string;
    format?: string;
    storeId?: string;
    customScript?: string;
    selectedAvatarIds?: string[];
    selectedAngleIds?: string[];
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

            // Language bank del avatar (frases reales que usa)
            const painPhrases = (avatar.language?.pain_phrases || []).slice(0, 4).join(' / ');
            const hopePhrases = (avatar.language?.hope_phrases || []).slice(0, 3).join(' / ');
            const objections = (avatar.language?.objections || avatar.language?.blocking_beliefs || []).slice(0, 2).join(' / ');
            const langContext = painPhrases ? `\nFrases reales que usa este avatar (úsalas textualmente en el script):\n- Pain: ${painPhrases}\n- Hope: ${hopePhrases}${objections ? '\n- Objeciones: ' + objections : ''}` : '';

            // Datos adicionales del avatar
            const triggerExp = avatar.trigger_experience || '';
            const coreDesire = avatar.core_desire || '';
            const internalDialogue = avatar.internal_dialogue || '';
            const awarenessLevel = avatar.awareness_level || 'problem_aware';

            const systemPrompt = `Eres un copywriter de élite especializado en video ads de respuesta directa para META con tasas de conversión superiores al 3%. Dominas los principios de Eugene Schwartz en "Breakthrough Advertising", la psicología de los 8 Life Force Desires, y la fórmula: Hook Emocional (Open Loop) > Identificar Avatar > Embudo hacia Producto (Mecanismo Único).

REGLAS ABSOLUTAS:
- Escribe SOLO el script hablado. Sin títulos, sin asteriscos, sin explicaciones, sin numeración.
- Usa el lenguaje EXACTO del avatar — sus frases literales, su jerga, su tono emocional real.
- El script debe sonar como una persona real hablando, NO como texto escrito.
- Usa puntos suspensivos (...) para crear pausas dramáticas naturales.

ESTRUCTURA OBLIGATORIA (máximo 60 segundos total):

HOOK (3-5 seg | 4-12 palabras):
- Patrón interrupt conversacional y dramático
- Nunca revelar el producto en el hook
- Siempre incluir open loop
- Tipos: Social Witness / Paradoja / Contraste Tiempo-Esfuerzo / Confrontación de Creencia / Brecha Edad-Percepción / Descubrimiento Científico / Métrica+Urgencia / Consecuencia Relacional

BLOQUE 1 - AMPLIFICACIÓN EMOCIONAL + ESPERANZA (8-10 seg):
- Agitar el problema con el lenguaje visual del avatar
- Introducir ESPERANZA sin revelar el producto
- Activar Life Force 8: Evitar Dolor (vergüenza social) + Seguir siendo Atractivo/a

BLOQUE 2 - REVELACIÓN DEL MECANISMO (10-12 seg):
- Presentar el mecanismo único como breakthrough
- Lenguaje científico accesible
- Contraste implícito con soluciones fallidas anteriores

BLOQUE 3 - PROGRESIÓN TEMPORAL DE RESULTADOS (8-10 seg):
- Timeline específico con micro-victorias
- Semana 1: resultado sensorial/táctil
- Semana 2-3: resultado visible
- Mes 1: transformación completa + identidad

BLOQUE 4 - CTA + REVERSIÓN DE RIESGO (5-8 seg):
- Cierre asuntivo: "Si estás lista/o para [acción]..."
- Garantía específica (90 días)
- Urgencia: "Mientras queden unidades" / "Descuento por tiempo limitado"
- Instrucción simple: "Haz clic abajo"

PSICOLOGÍA (activar MÍNIMO 2):
1. Supervivencia/Salud
2. Seguir siendo Atractivo/a
3. Evitar Dolor (vergüenza social)
4. Comodidad (sin esfuerzo)
5. Aprobación Social

REGLAS DE EJECUCIÓN:
- Especificidad obsesiva: no "resultados rápidos" sino "en 14 días"
- Verbos de transformación: "borrando, desapareciendo, activando, despertando"
- Lenguaje del avatar: usa SUS palabras exactas de la investigación
- Mecanismo > Característica: no "tiene retinol" sino "el retinol penetra la dermis y activa la producción de colágeno"
- Total: 75-110 palabras (30-45 segundos de locución)`;

            const userPrompt = `PRODUCTO: ${productTitle}
AVATAR: ${avatarDesc}
EXPERIENCIA TRIGGER: ${triggerExp}
DESEO CENTRAL: ${coreDesire}
DIÁLOGO INTERNO: ${internalDialogue}
ÁNGULO: ${angleText}
HOOK: ${hook}
PAIN POINT: ${pain}
BENEFICIO: ${benefit}
NIVEL DE CONSCIENCIA: ${awarenessLevel}
IDIOMA: Español mexicano (CDMX)${langContext}
FORMATO: ${modeInstructions[mode] || modeInstructions['auto']}

Escribe el script completo con la estructura Hook→Problema→Solución→Prueba Social→CTA:`;

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
            const script = text ? text.trim() : ResearchLabConnector.buildScriptFallback(angle);
            console.log('[Script Claude]\n---\n' + script + '\n---');
            return script;

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

        // Filtrar por selección explícita si viene del UI
        const selectedAvIds = opts.selectedAvatarIds;
        const filteredAvatars = selectedAvIds && selectedAvIds.length > 0
            ? allAvatars.filter((_: any, i: number) => selectedAvIds.includes(String(i)))
            : avatars.length > 0 ? avatars : allAvatars;
        const finalAvatars = filteredAvatars.length > 0 ? filteredAvatars : allAvatars;

        // Ángulos del research
        const angles = (
            results.marketing_angles?.angle_tree ||
            results.angles?.angle_tree ||
            results.angles ||
            []
        ).slice(0, maxVideos);

        const selectedAngIds = opts.selectedAngleIds;
        const finalAngles = selectedAngIds && selectedAngIds.length > 0
            ? angles.filter((_: any, i: number) => selectedAngIds.includes(String(i)))
            : angles;
        if (finalAngles.length === 0) throw new Error('No angles found in research');

        // Generar scripts con Claude en paralelo (máximo maxVideos combinaciones)
        const combos = finalAngles.slice(0, maxVideos).map((angle: any, i: number) => ({
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
        const age = avatar.age || '35';
        const occupation = avatar.occupation || 'professional';
        const location = avatar.location || 'Latin America';
        const name = avatar.name || '';
        
        // Inferir género desde el nombre y ocupación
        const femaleIndicators = ['sofía','sofia','maría','maria','marcela','daniela','mujer','woman','female','coordinadora','mamá','mama','divorciada'];
        const isFemale = femaleIndicators.some(w => name.toLowerCase().includes(w) || occupation.toLowerCase().includes(w));
        const gender = isFemale ? 'woman' : 'man';
        
        // Extraer rasgos de la biografía
        const bio = avatar.biography || '';
        const isTired = bio.toLowerCase().includes('cansad') || bio.toLowerCase().includes('agotad') || bio.toLowerCase().includes('ojeras');
        const isProf = bio.toLowerCase().includes('corporativ') || bio.toLowerCase().includes('oficin') || occupation.toLowerCase().includes('coordinador') || occupation.toLowerCase().includes('gerente');
        
        const appearance = isTired 
            ? 'slightly tired but determined expression, natural skin with slight dark circles, no heavy makeup'
            : 'natural authentic expression, minimal makeup';
        
        const style = isProf 
            ? 'smart casual office attire, modern apartment or home office background'
            : 'casual everyday outfit, home setting';
        
        return `candid authentic UGC photo, real ${gender} ${age} years old, ${occupation}, ${location}, ${appearance}, ${style}, looking directly at camera, soft natural window lighting, iPhone portrait quality, real person not a model, natural imperfections, genuine spontaneous expression, 9:16 vertical portrait`;
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
