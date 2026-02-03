import { prisma } from "@/lib/prisma";

export type KpiStatus = "GREEN" | "YELLOW" | "RED" | "INCOMPLETE" | "NEUTRAL";

export interface KpiMetric {
    value: number;
    isAvailable: boolean;
    source: string;
}

export class ThresholdService {
    /**
     * Gets the active threshold for a store and date.
     */
    static async getActiveThreshold(storeId: string, date: Date = new Date()) {
        return await prisma.thresholdConfig.findFirst({
            where: {
                storeId,
                type: "GLOBAL",
                validFrom: { lte: date },
                OR: [
                    { validTo: null },
                    { validTo: { gte: date } }
                ]
            },
            orderBy: { version: "desc" }
        });
    }

    /**
     * Calculates the status of a single metric based on threshold.
     */
    static calculateMetricStatus(
        metricName: string,
        metric: KpiMetric,
        threshold: any
    ): KpiStatus {
        if (!metric.isAvailable) return "INCOMPLETE";
        if (!threshold) return "NEUTRAL";

        const value = metric.value;

        switch (metricName) {
            case "profitPercent":
                if (value >= threshold.minProfitPercent) return "GREEN";
                if (value >= threshold.minProfitPercent * 0.7) return "YELLOW";
                return "RED";

            case "roas":
                if (value >= threshold.minRoas) return "GREEN";
                if (value >= threshold.minRoas * 0.8) return "YELLOW";
                return "RED";

            case "deliveryRate":
                if (value >= threshold.minDeliveryRate) return "GREEN";
                if (value >= threshold.minDeliveryRate * 0.9) return "YELLOW";
                return "RED";

            case "confirmRate":
                if (value >= threshold.minConfirmRate) return "GREEN";
                if (value >= threshold.minConfirmRate * 0.9) return "YELLOW";
                return "RED";

            case "incidenceRate":
                if (value <= threshold.maxIncidenceRate) return "GREEN";
                if (value <= threshold.maxIncidenceRate * 1.5) return "YELLOW";
                return "RED";

            case "returnRate":
                if (value <= threshold.maxReturnRate) return "GREEN";
                if (value <= threshold.maxReturnRate * 1.2) return "YELLOW";
                return "RED";

            default:
                return "NEUTRAL";
        }
    }

    /**
     * Calculates the global status based on multiple KPIs.
     * If any critical KPI is RED or INCOMPLETE, the global status reflects that.
     */
    static calculateGlobalStatus(metrics: Record<string, KpiStatus>, threshold: any): KpiStatus {
        const statuses = Object.values(metrics);

        if (statuses.includes("INCOMPLETE")) return "INCOMPLETE";
        if (statuses.includes("RED")) return "RED";
        if (statuses.includes("YELLOW")) return "YELLOW";
        if (statuses.includes("GREEN")) return "GREEN";

        return "NEUTRAL";
    }
}
