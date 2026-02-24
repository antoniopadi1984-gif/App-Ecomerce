import { StrategyContext } from "./creative-orchestrator";

export class AdGenerator {
    private strategy: any;
    private research: any;
    private ctx: StrategyContext;

    constructor(strategy: any, research: any, ctx: StrategyContext) {
        this.strategy = strategy;
        this.research = research;
        this.ctx = ctx;
    }

    /**
     * Generates a batch of static ads as per Phase 7.
     */
    async generateStaticAds(count: number = 5) {
        const avatar = this.ctx.avatar;
        const angles = JSON.parse(this.research.hookAngleDb || '{"angles":[]}').angles;

        return Array.from({ length: count }).map((_, i) => {
            const angle = angles[i % angles.length] || { hook: "Curiosidad extrema...", angle: "Beneficio puro" };

            return {
                type: "STATIC_AD",
                angle_name: angle.angle,
                variants: [
                    {
                        hook_visual: `Imagen real de persona sufriendo ${avatar.pains?.[0] || 'dolor'} vs después de usar ${this.strategy.uniqueMechanism}.`,
                        headline: angle.hook || "El secreto para...",
                        body: `¿Cansado de ${avatar.pains?.[1] || 'los problemas de siempre'}? Descubre cómo el ${this.strategy.uniqueMechanism} está cambiando vidas.`,
                        cta: "Ver Más Información"
                    }
                ]
            };
        });
    }
}
