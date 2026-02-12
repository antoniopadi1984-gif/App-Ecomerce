"use server";

import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import prisma from "@/lib/prisma";

/**
 * SERVICIO CENTRAL DE INTELIGENCIA (Búnker AI)
 * Gestión de modelos: Gemini (Research), Claude (Copywriting), GPT-4 (Logic)
 */

/**
 * Obtiene el contexto actual de la tienda para alimentar a la IA
 */
export async function getStoreContext() {
    try {
        // 1. Sales Stats (Last 24h)
        const yesterday = new Date();
        yesterday.setHours(yesterday.getHours() - 24);

        const recentOrders = await (prisma as any).order.findMany({
            where: { createdAt: { gte: yesterday } },
            include: { items: true }
        });
        const revenue24h = recentOrders.reduce((acc: any, o: any) => acc + o.totalPrice, 0);

        // 2. Low Stock Alerts
        const lowStock = await (prisma as any).productVariant.findMany({
            where: { inventoryQuantity: { lt: 10 } },
            include: { product: true },
            take: 5
        });

        // 3. Active Campaigns (Mocked or DB if available)
        // const campaigns = await prisma.campaign.findMany({ where: { status: 'ACTIVE' } }); 

        return `
            CONTEXTO DE LA TIENDA (Tiempo Real):
            - Ventas 24h: €${revenue24h.toFixed(2)} (${recentOrders.length} pedidos).
            - Alerta Stock Bajo: ${lowStock.map((v: any) => `${v.product.title} (${v.title}: ${v.inventoryQuantity} unid)`).join(", ") || "Ninguna"}.
            - Fecha Actual: ${new Date().toLocaleString('es-ES')}.
        `;
    } catch (e) {
        console.error("Error building context:", e);
        return "";
    }
}

import { agentDispatcher } from './agents/agent-dispatcher';

/**
 * LEGACY ADAPTER - Mantener compatibilidad
 * Ahora usa el sistema de agentes internamente para decidir el mejor modelo.
 */
export async function askGemini(
    prompt: string,
    context?: string,
    optionsOrImage?: string | { imageBase64?: string, model?: string, apiVersion?: 'v1' | 'v1beta' }
) {
    console.log('[Legacy askGemini] Routing to agent dispatcher...');

    // Bridge para opciones legacy
    let cleanContext = context || "";
    if (typeof optionsOrImage === 'object' && optionsOrImage.imageBase64) {
        // Si hay una imagen, podríamos manejarla aquí o pasarla como contexto
        cleanContext += `\n[Imagen adjunta en formato base64 detectada]`;
    }

    try {
        // Despachar con auto-detección de tarea basada en el prompt
        const result = await agentDispatcher.dispatchAuto(prompt, prompt, cleanContext);

        return { text: result.text };
    } catch (e: any) {
        console.error("askGemini Exception:", e);
        return { error: `Network/Server Error: ${e.message}` };
    }
}

export async function askClaude(prompt: string, systemPrompt?: string) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return { error: "Falta ANTHROPIC_API_KEY en el servidor." };

    try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            },
            body: JSON.stringify({
                model: "claude-3-5-sonnet-20240620",
                max_tokens: 2048,
                system: systemPrompt || "Eres un experto en Marketing Directo y Copywriting de respuesta directa.",
                messages: [{ role: "user", content: prompt }]
            })
        });

        const data = await response.json();
        return { text: data.content?.[0]?.text || "No se obtuvo respuesta de Claude." };
    } catch (e: any) {
        return { error: e.message };
    }
}

/**
 * Agente Especialista en Marketing Profundo
 * Genera ángulos y conceptos basados en investigación técnica
 */
export async function deepMarketingResearch(productInfo: any, avatarInfo: any) {
    const prompt = `
        Analiza profundamente este producto y este perfil de cliente.
        Producto: ${JSON.stringify(productInfo)}
        Avatar: ${JSON.stringify(avatarInfo)}
        
        Tu tarea: Proporcionar 3 Ángulos de Marketing disruptivos y 3 Conceptos Creativos.
        Para cada uno, define una Nomenclatura Base (siglas de 4 letras).
        Formato de respuesta: JSON con { angles: [{ name, code, reason }], concepts: [{ name, code }] }
    `;

    return askGemini(prompt);
}
