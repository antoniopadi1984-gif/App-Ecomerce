import { prisma } from '@/lib/prisma';
import type { VideoAdConfig } from '../orchestrators/video-ad-orchestrator';

/**
 * Connector entre Research Lab y Creative Factory
 * Convierte datos de investigación en configuraciones de videos
 */
export class ResearchLabConnector {

    /**
     * Obtener configuraciones de videos desde el Research Lab
     * basadas en avatares y ángulos de marketing reales
     */
    static async getVideoConfigsFromResearch(
        productId: string,
        maxVideos: number = 3
    ): Promise<VideoAdConfig[]> {
        try {
            // 1. Obtener el último research READY del producto
            const run = await (prisma.researchRun as any).findFirst({
                where: { productId, status: 'READY' },
                orderBy: { createdAt: 'desc' }
            });

            if (!run) {
                throw new Error(`No research run found for product ${productId}`);
            }

            const results = JSON.parse(run.results || '{}');
            const configs: VideoAdConfig[] = [];

            // 2. Obtener avatares (limitar a top 3)
            const avatars = (results.v3_avatars || results.avatars?.avatars || results.avatars || []).slice(0, 3);

            // 3. Obtener ángulos (limitar a maxVideos)
            const angles = (results.marketing_angles?.angle_tree || results.angles?.angle_tree || results.angles || []).slice(0, maxVideos);

            // 4. Crear configs combinando avatares con ángulos
            for (let i = 0; i < Math.min(maxVideos, angles.length); i++) {
                const avatar = avatars.length > 0 ? avatars[i % avatars.length] : {}; // Rotar avatares si hay menos
                const angle = angles[i];

                configs.push({
                    avatarPrompt: this.buildAvatarPrompt(avatar),
                    script: this.buildScript(angle),
                    concept: `${avatar.name || 'Avatar ' + (i + 1)} - ${angle.concept || angle.angle || 'Concepto ' + (i + 1)}`,
                    voiceId: this.selectVoice(avatar)
                });
            }

            return configs;

        } catch (error) {
            console.error('[ResearchLabConnector] Error:', error);
            throw error;
        }
    }

    /**
     * Construir prompt de avatar desde datos del research
     */
    private static buildAvatarPrompt(avatar: any): string {
        const age = avatar.age || avatar.demographics?.age || '35';
        const gender = avatar.gender || 'professional person';
        const occupation = avatar.occupation || avatar.name || 'professional';
        const ethnicity = avatar.demographics || avatar.ethnicity || 'Spanish';

        return `${ethnicity} ${gender}, ${age} years old, ${occupation}, friendly professional expression, looking directly at camera, natural lighting, high quality portrait`;
    }

    /**
     * Construir script desde ángulo de marketing
     */
    private static buildScript(angle: any): string {
        // Prioridad: lead_lines > hooks > painPoints > default
        if (angle.lead_lines) {
            return angle.lead_lines;
        }

        if (angle.hooks && Array.isArray(angle.hooks) && angle.hooks.length > 0) {
            const hook = angle.hooks[0];
            return hook.text || hook.hook || hook;
        }

        if (angle.painPoints && Array.isArray(angle.painPoints) && angle.painPoints.length > 0) {
            const pain = angle.painPoints[0];
            return pain.text || pain.painPoint || pain;
        }

        // Fallback: construir desde concept y angle
        const concept = angle.concept || '';
        const angleText = angle.angle || '';

        if (concept && angleText) {
            return `${concept}: ${angleText}`;
        }

        return concept || angleText || 'Descubre la solución que estabas buscando.';
    }

    /**
     * Seleccionar voz según avatar
     */
    private static selectVoice(avatar: any): string | undefined {
        const gender = (avatar.gender || '').toLowerCase();

        if (gender.includes('male') || gender.includes('hombre') || gender.includes('man')) {
            return process.env.ELEVENLABS_VOICE_MALE;
        }

        return process.env.ELEVENLABS_VOICE_FEMALE;
    }

    /**
     * Obtener configuraciones genéricas para testing
     * (cuando no hay research disponible)
     */
    static getTestConfigs(): VideoAdConfig[] {
        return [
            {
                avatarPrompt: 'Spanish woman, 35 years old, professional businesswoman, friendly smile, looking at camera',
                script: '¿Sabías que el 80% de las personas sufren de falta de energía? Descubre el secreto para tener energía todo el día.',
                concept: 'Test Video 1 - Pain Point (Mujer profesional)',
                voiceId: process.env.ELEVENLABS_VOICE_FEMALE
            },
            {
                avatarPrompt: 'Spanish man, 45 years old, executive, confident expression, professional attire',
                script: 'Tu cerebro merece lo mejor. Ingredientes naturales, resultados reales. Sin estimulantes artificiales.',
                concept: 'Test Video 2 - Benefits (Hombre ejecutivo)',
                voiceId: process.env.ELEVENLABS_VOICE_MALE
            },
            {
                avatarPrompt: 'Spanish woman, 28 years old, fitness enthusiast, energetic, athletic wear',
                script: 'Más de 10,000 personas ya confían en nosotros. Energía natural, concentración máxima. Pruébalo hoy.',
                concept: 'Test Video 3 - Social Proof (Mujer deportista)',
                voiceId: process.env.ELEVENLABS_VOICE_FEMALE
            }
        ];
    }
}
