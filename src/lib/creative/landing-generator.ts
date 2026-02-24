import { StrategyContext } from "./creative-orchestrator";

export class LandingGenerator {
    private strategy: any;
    private research: any;
    private ctx: StrategyContext;

    constructor(strategy: any, research: any, ctx: StrategyContext) {
        this.strategy = strategy;
        this.research = research;
        this.ctx = ctx;
    }

    /**
     * Generates a full Landing Page structure following Phase 4 requirements.
     */
    async generate() {
        const avatar = this.ctx.avatar;
        const language = JSON.parse(this.research.languageBank || '{}');
        const mechanism = this.strategy.uniqueMechanism;

        return {
            type: "LANDING",
            sections: [
                {
                    id: "hero",
                    headline: this.strategy.bigIdea,
                    subheadline: `La única solución que utiliza ${mechanism} para erradicar ${avatar.pains?.[0] || 'sus problemas actuales'}.`,
                    cta: "Quiero Probarlo Ahora",
                    visual_direction: "Imagen de alta densidad mostrando el mecanismo en acción."
                },
                {
                    id: "deep_problem",
                    title: "¿Cansada de sentir que nada funciona?",
                    content: `Sabemos lo que es ${language.literal_quotes?.[0] || 'sentirse frustrada'}. No es tu culpa, el mercado está saturado de promesas vacías. El problema real no es la falta de voluntad, sino ${avatar.main_objection || 'la ineficiencia de los métodos tradicionales'}.`,
                    quotes: language.literal_quotes?.slice(0, 3) || []
                },
                {
                    id: "solution_mechanism",
                    title: `Presentamos el ${mechanism}`,
                    description: "A diferencia de todo lo que has probado, nuestro sistema ataca la raíz del problema mediante...",
                    highlights: ["No invasivo", "Resultados en X días", "Respaldado por ciencia"]
                },
                {
                    id: "hormozi_stack",
                    offer: "The Grand Slam Offer",
                    items: [
                        { name: "Producto Principal", value: "97€" },
                        { name: "Guía de Inicio Rápido", value: "GRATIS" },
                        { name: "Soporte 24/7", value: "GRATIS" }
                    ],
                    total_value: "197€",
                    price: "47€",
                    guarantee: "Garantía de Satisfacción 100% o devolución total."
                }
            ]
        };
    }
}
