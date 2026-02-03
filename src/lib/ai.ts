"use server";

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

export async function askGemini(prompt: string, context?: string, imageBase64?: string) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { error: "Falta GEMINI_API_KEY en el servidor." };

    try {
        const parts: any[] = [{ text: (context ? `CONTEXTO MAESTRO:\n${context}\n\n` : "") + prompt }];

        if (imageBase64) {
            let mimeType = "image/jpeg";
            let cleanBase64 = imageBase64;

            if (imageBase64.startsWith("data:")) {
                const match = imageBase64.match(/^data:([^;]+);base64,(.*)$/);
                if (match) {
                    mimeType = match[1];
                    cleanBase64 = match[2];
                }
            }

            // Check size (Base64 is ~33% larger than raw)
            const approxSizeMB = (cleanBase64.length * 0.75) / (1024 * 1024);
            if (approxSizeMB > 15) {
                return { error: `Video is too large for direct AI analysis (${approxSizeMB.toFixed(1)}MB). Please use a clip under 15MB.` };
            }

            parts.push({
                inline_data: {
                    mime_type: mimeType,
                    data: cleanBase64
                }
            });
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: parts }],
                generationConfig: {
                    temperature: 0.4,
                    topP: 0.8,
                    topK: 40,
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            const msg = data?.error?.message || response.statusText;
            console.error("Gemini API Error:", data);
            return { error: `Gemini API Error (${response.status}): ${msg}` };
        }

        if (data.promptFeedback?.blockReason) {
            return { error: `AI Safety Block: ${data.promptFeedback.blockReason}. Content might violate policies.` };
        }

        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!content) {
            console.warn("Empty Gemini Response:", data);
            return { error: "AI returned an empty response. Try again with a different part of the video." };
        }

        return { text: content };
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
