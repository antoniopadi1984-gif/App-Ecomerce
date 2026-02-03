
import { GeminiService } from "../gemini";

export interface MediaBuyingInsight {
    title: string;
    description: string;
    level: 'OPTIMAL' | 'WARNING' | 'CRITICAL' | 'INFO';
    action?: string;
}

export class MediaBuyingAdviser {
    private static gemini = new GeminiService();

    /**
     * Expert analysis of Meta Ads metrics.
     */
    static async analyzeCampaigns(data: any[]): Promise<MediaBuyingInsight[]> {
        if (!data || data.length === 0) return [];

        const prompt = `
            Eres un Especialista Senior en Media Buying (Experto en Meta Ads). 
            Tu objetivo es analizar los siguientes datos de rendimiento y dar 3-4 consejos accionables para optimizar las campañas.
            
            DATOS DE RENDIMIENTO:
            ${JSON.stringify(data.map(d => ({
            name: d.name,
            spend: d.spend,
            revenue: d.revenue,
            roas: d.roas,
            ctr: d.ctr,
            hook_rate: d.hook_rate,
            hold_rate: d.hold_rate,
            atc_rate: d.atc_rate,
            real_cpa: d.real_cpa,
            level: d.level
        })), null, 2)}

            REGLAS DE ANÁLISIS:
            1. Si el Hook Rate (Stop Rate) es < 25%, el problema es el primer 3 segundos del video.
            2. Si el Hold Rate es < 15%, el contenido después del gancho no mantiene el interés.
            3. Si el CTR es < 1%, el ángulo creativo o el público no encajan.
            4. Si el ROAS está por debajo del breakeven (supón 2.5), recomienda pausar o bajar presupuesto.
            5. Considera el "Real CPA" (Basado en pedidos reales de Shopify) como la métrica de verdad.

            FORMATO DE RESPUESTA:
            Genera un JSON con el siguiente formato EXACTO:
            [
                { "title": "Título corto", "description": "Explicación técnica", "level": "CRITICAL|WARNING|OPTIMAL|INFO", "action": "Acción sugerida" }
            ]
            No incluyas charla extra, solo el JSON.
        `;

        try {
            const response = await this.gemini.generateContent(prompt, { temperature: 0.3 });
            // Clean response to handle potential markdown code blocks
            const cleanResponse = response.replace(/```json|```/g, "").trim();
            return JSON.parse(cleanResponse);
        } catch (error) {
            console.error("🛑 [MediaBuyingAdviser] Analysis failed:", error);
            // Fallback basic insights if AI fails
            return [
                {
                    title: "Análisis en pausa",
                    description: "No se pudo conectar con el especialista IA. Revisa tus métricas de ROAS y CPA manualmente.",
                    level: "INFO",
                    action: "Reintentar más tarde"
                }
            ];
        }
    }
}
