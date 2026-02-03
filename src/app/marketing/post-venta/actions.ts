"use server";

import { prisma } from "@/lib/prisma";
import { askGemini } from "@/lib/ai";

export async function calculateOrderRisk(orderId: string) {
    try {
        const order = await (prisma as any).order.findUnique({ where: { id: orderId } });
        if (!order) throw new Error("Pedido no encontrado");

        // Logic: historical cancellations, geography, time of order...
        const riskPrompt = `
            Actúa como un Especialista en Fraude y Logística COD.
            Evalúa el RIESGO de que este pedido NO sea aceptado.
            
            DIRECCIÓN: ${order.city}, ${order.country}
            PRECIO: ${order.totalPrice} ${order.currency}
            TELÉFONO VALIDADO: ${order.phoneValidated}
            
            NECESITO (JSON):
            {
               "riskScore": 0-100,
               "riskLevel": "LOW / MEDIUM / HIGH",
               "reasons": ["...", "..."],
               "strategy": "Contenido educativo o Refuerzo de confianza"
            }
        `;

        const res = await askGemini(riskPrompt, "Eres un analista de riesgos de e-commerce.");
        const data = JSON.parse(res.text.match(/\{[\s\S]*\}/)?.[0] || "{}");

        await (prisma as any).order.update({
            where: { id: orderId },
            data: { riskScore: data.riskScore, riskLevel: data.riskLevel }
        });

        return data;
    } catch (e: any) {
        throw new Error(e.message);
    }
}

export async function generateReinforcementContent(orderId: string) {
    try {
        const order = await (prisma as any).order.findUnique({ where: { id: orderId }, include: { store: true } });

        const prompt = `
            El cliente ha pedido ${order.productTitle} pero tenemos RIESGO ${order.riskLevel}.
            Genera un mensaje de WhatsApp de "Refuerzo de Valor" para asegurar la entrega.
            No vendas, enseña.
            
            NECESITO (JSON):
            {
               "headline": "...",
               "body": "...",
               "bonusTip": "Un consejo de uso que aumente el deseo de recibir el paquete",
               "reasonToAccept": "Recordatorio honesto de por qué pidió esto"
            }
        `;

        const res = await askGemini(prompt, "Eres un copywriter de post-venta brillante.");
        return JSON.parse(res.text.match(/\{[\s\S]*\}/)?.[0] || "{}");
    } catch (e: any) {
        throw new Error(e.message);
    }
}
