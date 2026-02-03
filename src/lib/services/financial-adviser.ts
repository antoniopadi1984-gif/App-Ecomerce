
import { DailySnapshot } from "@prisma/client";

export interface FinancialInsight {
    title: string;
    description: string;
    level: 'OPTIMAL' | 'WARNING' | 'CRITICAL' | 'INFO';
    action?: string;
}

export class FinancialAdviser {
    /**
     * Analyzes snapshots and generates proactive financial advice.
     */
    static analyzePerformance(snapshots: any[], thresholds: any): FinancialInsight[] {
        const insights: FinancialInsight[] = [];
        if (snapshots.length === 0) return insights;

        const latest = snapshots[snapshots.length - 1];
        const previous = snapshots.length > 1 ? snapshots[snapshots.length - 2] : null;

        // 1. Profit Margin Check
        const profitMargin = latest.revenueReal > 0 ? (latest.netProfit / latest.revenueReal) * 100 : 0;
        const targetMargin = thresholds?.minProfitPercent || 25;

        if (profitMargin < 0) {
            insights.push({
                title: "Rentabilidad Crítica",
                description: `Tu margen actual es de ${profitMargin.toFixed(1)}%. Estás perdiendo dinero hoy. Revisa el CPA de tus campañas de inmediato.`,
                level: 'CRITICAL',
                action: "Ajustar CPA en Ads"
            });
        } else if (profitMargin < targetMargin) {
            insights.push({
                title: "Margen Bajo",
                description: `El margen de beneficio (${profitMargin.toFixed(1)}%) está por debajo de tu objetivo del ${targetMargin}%.`,
                level: 'WARNING',
                action: "Optimizar Costes"
            });
        }

        // 2. ROAS Trend
        if (previous && latest.roasReal < previous.roasReal && latest.spendAds > 0) {
            const drop = ((previous.roasReal - latest.roasReal) / previous.roasReal) * 100;
            if (drop > 15) {
                insights.push({
                    title: "Caída de ROAS Detectada",
                    description: `El ROAS ha caído un ${drop.toFixed(1)}% respecto a ayer. Considera revisar la fatiga creativa o posibles errores en el funnel de ventas.`,
                    level: 'WARNING',
                    action: "Auditar Creativos"
                });
            }
        }

        // 3. Logistics efficiency
        if (latest.deliveryRate < (thresholds?.minDeliveryRate || 80) && latest.deliveryRate > 0) {
            insights.push({
                title: "Eficiencia Logística",
                description: `La tasa de entrega hoy es del ${latest.deliveryRate.toFixed(1)}%. Las incidencias están afectando tu rentabilidad neta.`,
                level: 'INFO',
                action: "Gestionar Incidencias"
            });
        }

        // 4. ROI Positive reinforcement
        if (profitMargin > targetMargin + 10) {
            insights.push({
                title: "Escalado Positivo",
                description: `Excelente rendimiento. Tu ROI y margen (${profitMargin.toFixed(1)}%) permiten un escalado más agresivo del presupuesto.`,
                level: 'OPTIMAL',
                action: "Incrementar AdSpend"
            });
        }

        return insights;
    }
}
