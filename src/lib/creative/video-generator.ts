import { StrategyContext } from "./orchestrator";

export class VideoScriptGenerator {
    private strategy: any;
    private research: any;
    private ctx: StrategyContext;

    constructor(strategy: any, research: any, ctx: StrategyContext) {
        this.strategy = strategy;
        this.research = research;
        this.ctx = ctx;
    }

    /**
     * Generates video scripts based on the requested mode (Phase 8).
     */
    async generateScript(mode: "AVATAR_IA" | "UGC" | "CLIP_MONTAGE") {
        const avatar = this.ctx.avatar;
        const language = JSON.parse(this.research.languageBank || '{}');
        const mechanism = this.strategy.uniqueMechanism;

        switch (mode) {
            case "AVATAR_IA":
                return {
                    mode: "Avatar IA",
                    scenes: [
                        {
                            hook: "¿Te has preguntado alguna vez por qué nada parece funcionar para tu piel?",
                            visual: "Avatar mirando a cámara con gesto de curiosidad.",
                            overlay: "LA VERDAD SOBRE..."
                        },
                        {
                            body: `La mayoría de la gente ignora que ${mechanism} es la clave.`,
                            visual: "Diagrama técnico del mecanismo biológico.",
                            overlay: "EL SECRETO: " + mechanism
                        },
                        {
                            cta: "Haz clic abajo para ver el estudio completo.",
                            visual: "Avatar señalando al botón de CTA.",
                            overlay: "PRUÉBALO HOY"
                        }
                    ]
                };

            case "UGC":
                return {
                    mode: "UGC Style",
                    script: `(Selfie Mode) "Chicos, tengo que enseñaros esto. Como ${avatar.name}, siempre he sufrido con ${avatar.pains?.[0] || 'esto'}. Pero mirad... (Muestra producto). Desde que descubrí el ${mechanism}, mi vida cambió. Literalmente ${language.literal_quotes?.[0] || 'me siento otra persona'}. Si estás pasando por lo mismo, necesitas probarlo."`,
                    hooks: ["Mi secreto para...", "Lo que las marcas no te dicen...", "Finalmenté encontré la solución."]
                };

            case "CLIP_MONTAGE":
                return {
                    mode: "Clip Montage",
                    narrative: [
                        "Clip 1: Antes (Persona frustrada)",
                        "Clip 2: Transición (Moléculas / Ciencia)",
                        "Clip 3: Después (Felicidad / Resultados)",
                        "Clip 4: Uso del producto"
                    ],
                    text_overlays: [
                        "BASTA DE PROMESSAS",
                        "CIENCIA REAL",
                        "MECANISMO " + mechanism
                    ]
                };
        }
    }
}
