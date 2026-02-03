"use server";

import { askGemini } from "@/lib/ai";
import prisma from "@/lib/prisma";

export async function getFinancialAdvice(goal: string) {
    try {
        // 1. Build Context from Master Ledger (Last 30 days for better perspective)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const entries = await (prisma as any).ledgerEntry.findMany({
            where: { date: { gte: thirtyDaysAgo } }
        });

        const totalRevenue = entries.filter((e: any) => e.category === 'REVENUE').reduce((a: number, b: any) => a + b.amount, 0);
        const totalCogs = entries.filter((e: any) => e.category === 'COGS').reduce((a: number, b: any) => a + Math.abs(b.amount), 0);

        const adExpenses = await prisma.expense.findMany({
            where: { category: 'ADS', date: { gte: thirtyDaysAgo } }
        });
        const totalAdSpend = adExpenses.reduce((a: number, b: any) => a + b.amount, 0);

        const aov = totalRevenue > 0 ? totalRevenue / (entries.filter((e: any) => e.category === 'REVENUE').length || 1) : 0;
        const currentRoas = totalAdSpend > 0 ? totalRevenue / totalAdSpend : 0;
        const currentMargin = totalRevenue > 0 ? ((totalRevenue - totalCogs - totalAdSpend) / totalRevenue) * 100 : 0;

        const systemContext = `
            ROL: Eres el CFO Virtual Maestro (Búnker AI).
            DATOS REALES (Últimos 30 días):
            - Facturación Total: €${totalRevenue.toFixed(2)}
            - Inversión en Ads: €${totalAdSpend.toFixed(2)}
            - ROAS Actual: ${currentRoas.toFixed(2)}
            - Margen Neto Estimado: ${currentMargin.toFixed(1)}%
            - Ticket Medio (AOV): €${aov.toFixed(2)}

            TU MISIÓN: Analizar el objetivo del usuario y dar una hoja de ruta matemática.
            Si el usuario dice "Quiero ganar 10k este mes", calcula cuántas ventas necesita basándote en su AOV actual y cuánto puede gastar en Ads sin romper el margen.

            FORMATO: Sé conciso, usa negritas para los números clave y mantén un lenguaje de alto nivel financiero.
        `;

        const response = await askGemini(`OBJETIVO DEL USUARIO: ${goal}`, systemContext);
        return { success: true, text: response.text };
    } catch (error) {
        console.error("AI Finance Error:", error);
        return { success: false, error: "Error al consultar al búnker financiero." };
    }
}
