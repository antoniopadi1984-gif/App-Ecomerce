import { prisma } from "@/lib/prisma";

export interface StrategyContext {
    productId: string;
    versionId: string;
    avatar: any;
    desire: string;
    awareness: string;
    funnelType: string;
}

export class CreativeStrategyEngine {
    private ctx: StrategyContext;

    constructor(ctx: StrategyContext) {
        this.ctx = ctx;
    }

    /**
     * Orchestrates Phase 3: Generates the core strategy elements.
     * This synthesizes research into a creative brief.
     */
    async generateStrategy() {
        // 1. Fetch Research Outputs (Mode: Safe / Read-Only)
        const research = await (prisma as any).researchOutput.findFirst({
            where: { versionId: this.ctx.versionId }
        });

        if (!research) throw new Error("Missing Research Dependency: Research version not found.");

        const languageBank = JSON.parse(research.languageBank || '{}');
        const dna = JSON.parse(research.productIntelligence || '{}');
        const creativeInsights = JSON.parse(research.creativeInsights || '{}');

        // 2. Synthesize Big Idea & Unique Mechanism
        // Logic: Combine Product DNA (Science/Facts) with Avatar Pains/Desires
        const bigIdea = this.synthesizeBigIdea(dna, this.ctx.avatar, this.ctx.desire);
        const uniqueMechanism = dna.dna_forense?.unique_selling_proposition || "Mecanismo Biológico Optimizado";
        const transformationalPromise = `De ${this.ctx.avatar.pains?.[0] || 'el estado actual'} a ${this.ctx.desire} mediante el uso de ${uniqueMechanism}.`;

        return {
            bigIdea,
            uniqueMechanism,
            transformationalPromise,
            mainAngle: creativeInsights.angles?.[0] || { hook: "Descubre el secreto de...", body: "Cita del lenguaje bank..." }
        };
    }

    private synthesizeBigIdea(dna: any, avatar: any, desire: string): string {
        // Placeholder for LLM-based synthesis. 
        // In production, this would call an LLM with a specialized prompt.
        const coreBenefit = dna.dna_forense?.core_benefit || "Transformación Total";
        return `La convergencia de ${coreBenefit} para resolver ${avatar.name} en su búsqueda de ${desire}.`;
    }
}
