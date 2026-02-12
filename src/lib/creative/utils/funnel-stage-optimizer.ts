import type { VideoAdConfig } from '../orchestrators/video-ad-orchestrator';

/**
 * Scripts optimizados por etapa del funnel de ventas
 */
export class FunnelStageOptimizer {

    /**
     * Generar configs específicas para etapa COLD (Awareness)
     * Enfoque: Despertar interés, identificar pain points
     */
    static generateColdConfigs(
        product: { name: string; category?: string },
        targetAudience: string,
        painPoints: string[]
    ): VideoAdConfig[] {
        const configs: VideoAdConfig[] = [];

        // Pain Point Hook
        painPoints.slice(0, 3).forEach((pain, i) => {
            configs.push({
                avatarPrompt: `Spanish professional, 35 years old, relatable expression, ${targetAudience}`,
                script: `¿Sabías que ${pain.toLowerCase()}? Descubre cómo ${product.name} puede ayudarte.`,
                concept: `COLD - Pain Point ${i + 1}`,
                voiceId: process.env.ELEVENLABS_VOICE_FEMALE
            });
        });

        // Pattern Interrupt
        configs.push({
            avatarPrompt: `Spanish woman, 30 years old, energetic, direct eye contact`,
            script: `Detente. Si sufres de ${painPoints[0]?.toLowerCase() || 'este problema'}, esto es para ti. ${product.name} es diferente.`,
            concept: 'COLD - Pattern Interrupt',
            voiceId: process.env.ELEVENLABS_VOICE_FEMALE
        });

        return configs;
    }

    /**
     * Generar configs para etapa WARM (Consideration)
     * Enfoque: Beneficios, prueba social, características
     */
    static generateWarmConfigs(
        product: { name: string; benefits?: string[] },
        targetAudience: string
    ): VideoAdConfig[] {
        const configs: VideoAdConfig[] = [];
        const benefits = product.benefits || ['resultados reales', 'fácil de usar', 'probado científicamente'];

        // Benefits Hook
        configs.push({
            avatarPrompt: `Spanish woman, 35 years old, confident professional, ${targetAudience}`,
            script: `Con ${product.name} obtienes: ${benefits.slice(0, 3).join(', ')}. Más de 10,000 personas ya confían en nosotros.`,
            concept: 'WARM - Benefits + Social Proof',
            voiceId: process.env.ELEVENLABS_VOICE_FEMALE
        });

        // Testimonial Style
        configs.push({
            avatarPrompt: `Spanish man, 40 years old, sincere expression, professional`,
            script: `Llevo 3 meses usando ${product.name} y la diferencia es increíble. ${benefits[0] || 'Resultados reales'}, sin trucos.`,
            concept: 'WARM - Testimonial',
            voiceId: process.env.ELEVENLABS_VOICE_MALE
        });

        // Feature Highlight
        configs.push({
            avatarPrompt: `Spanish woman, 28 years old, knowledgeable, clear communicator`,
            script: `¿Qué hace único a ${product.name}? ${benefits.slice(0, 2).join(' y ')}. Diseñado específicamente para ti.`,
            concept: 'WARM - Unique Features',
            voiceId: process.env.ELEVENLABS_VOICE_FEMALE
        });

        return configs;
    }

    /**
     * Generar configs para etapa HOT (Decision)
     * Enfoque: CTA fuerte, urgencia, garantía
     */
    static generateHotConfigs(
        product: { name: string; offer?: string },
        targetAudience: string
    ): VideoAdConfig[] {
        const configs: VideoAdConfig[] = [];
        const offer = product.offer || 'oferta especial disponible ahora';

        // Direct CTA
        configs.push({
            avatarPrompt: `Spanish woman, 35 years old, confident, action-oriented`,
            script: `No esperes más. ${product.name} - ${offer}. Haz clic ahora y transforma tu vida hoy mismo.`,
            concept: 'HOT - Direct CTA',
            voiceId: process.env.ELEVENLABS_VOICE_FEMALE
        });

        // Urgency + Scarcity
        configs.push({
            avatarPrompt: `Spanish man, 40 years old, authoritative, direct`,
            script: `Última oportunidad: ${offer}. Stock limitado de ${product.name}. Compra ahora antes de que se agote.`,
            concept: 'HOT - Urgency',
            voiceId: process.env.ELEVENLABS_VOICE_MALE
        });

        // Risk Reversal
        configs.push({
            avatarPrompt: `Spanish woman, 32 years old, trustworthy, reassuring`,
            script: `Prueba ${product.name} sin riesgo. Garantía de devolución de dinero. Tu satisfacción es nuestra prioridad. Compra ahora.`,
            concept: 'HOT - Risk Reversal',
            voiceId: process.env.ELEVENLABS_VOICE_FEMALE
        });

        return configs;
    }

    /**
     * Auto-seleccionar configs según etapa del funnel
     */
    static getConfigsForStage(
        stage: 'COLD' | 'WARM' | 'HOT',
        product: any,
        researchData?: any
    ): VideoAdConfig[] {
        const targetAudience = researchData?.targetAudience || 'personas interesadas';
        const painPoints = researchData?.painPoints || ['problemas comunes', 'desafíos diarios'];
        const benefits = researchData?.benefits || product.benefits;

        switch (stage) {
            case 'COLD':
                return this.generateColdConfigs(product, targetAudience, painPoints);

            case 'WARM':
                return this.generateWarmConfigs(
                    { ...product, benefits },
                    targetAudience
                );

            case 'HOT':
                return this.generateHotConfigs(product, targetAudience);

            default:
                return [];
        }
    }

    /**
     * Generar suite completa (COLD + WARM + HOT)
     */
    static generateFullFunnel(
        product: any,
        researchData?: any
    ): {
        cold: VideoAdConfig[];
        warm: VideoAdConfig[];
        hot: VideoAdConfig[];
    } {
        return {
            cold: this.getConfigsForStage('COLD', product, researchData),
            warm: this.getConfigsForStage('WARM', product, researchData),
            hot: this.getConfigsForStage('HOT', product, researchData)
        };
    }
}
