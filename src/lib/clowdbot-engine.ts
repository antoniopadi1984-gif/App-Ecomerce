"use server";

import prisma from "./prisma";
import { askGemini } from "./ai";
import { getCustomerHistory } from "./logistics-engine";
import { AgentRouter, AgentContext } from "./agents/agent-router";

/**
 * Core Brain of Clowdbot
 * Processes incoming messages, applies brand knowledge, and maintains operational context.
 */
export async function processClowdbotMessage(customerId: string, content: string, channel: 'WHATSAPP' | 'EMAIL' | 'INSTAGRAM' | 'FACEBOOK', whatsappAccountId?: string) {
    const startTime = Date.now();
    try {
        // 1. Fetch associated order/customer context to get StoreId
        const order = await prisma.order.findFirst({
            where: {
                OR: [
                    { id: customerId },
                    { customerPhone: customerId },
                    { customerEmail: customerId }
                ]
            },
            include: { items: true, store: true }
        });

        const storeId = order?.storeId || "default-store";

        // 2. Select Agent using Router
        const agent = await AgentRouter.route('MESSAGE', {
            storeId,
            source: channel === 'WHATSAPP' ? 'WHATSAPP' : 'INBOX',
            orderId: order?.id
        });

        if (!agent || !(agent as any).isActive) {
            console.log(`[CLOWDBOT] No active agent found for store ${storeId}. Skipping.`);
            return null;
        }

        // 3. Fetch History & Risk (Semaforo)

        // 2b. Fetch History & Risk (Semaforo)
        const history = await getCustomerHistory(order?.customerEmail || undefined, order?.customerPhone || customerId);
        const totalOrders = history.length;
        const deliveredOrders = history.filter((h: any) => h.status === 'DELIVERED').length;
        const returnedOrders = history.filter((h: any) => h.status === 'RETURNED' || h.status === 'INCIDENCE').length;
        const deliveryRate = totalOrders > 0 ? (deliveredOrders / totalOrders * 100).toFixed(0) : "N/A";

        const riskIndicator = (order as any)?.riskLevel || "LOW";
        const riskColor = riskIndicator === 'HIGH' ? '🔴 ALTO RIESGO' : (riskIndicator === 'MEDIUM' ? '🟡 RIESGO MEDIO' : '🟢 SEGURO');

        // 4. Build Prompt using Agent Profile
        const toneBias = (agent as any).tone === 'ventas' ? "Tu objetivo es la conversión. Sé persuasivo." :
            (agent as any).tone === 'pro' ? "Sé profesional, directo y conciso." :
                "Sé cercano y empático.";

        const systemPrompt = `
            Eres ${(agent as any).name}, actuando como especialista en ${(agent as any).role}.
            
            GUÍA DE TONO: ${toneBias}
            
            INSTRUCCIONES ESPECÍFICAS:
            ${(agent as any).instructions}

        // 4. Build the knowledge-rich prompt
            SABIDURÍA GENERAL:
            Este es un sistema de ecommerce local en España. España Península 24-48h.
            
            CONTEXTO DEL CLIENTE:
            ${order ? `
                - Pedido Actual: #${order.orderNumber}
                - Comprador: ${order.customerName}
                - Estado: ${order.status}
                - Logística: ${order.logisticsProvider} (${order.logisticsStatus || "PENDIENTE"})
                - Tracking: ${order.trackingUrl || "No generado"}
                - Productos: ${order.items.map(i => `${i.quantity}x ${i.title}`).join(", ")}
                
                HISTORIAL & SEGURIDAD (SEMÁFORO):
                - Indicador: ${riskColor}
                - Pedidos Totales: ${totalOrders}
                - Entregados: ${deliveredOrders}
                - Devoluciones/Incidencias: ${returnedOrders}
                - Ratio de Entrega: ${deliveryRate}%
                - Notas Históricas: ${history.map((h: any) => h.incidenceResult).filter(Boolean).join(" | ") || "Sin incidencias registradas"}
            ` : "No hay pedido previo detectado. Trata de capturar sus datos gentilmente."}
            
            ${totalOrders > 1 ? `PRO-TIP: Este cliente ya ha comprado antes. ${deliveredOrders > 0 ? "Trátalo como cliente recurrente VIP." : "Ten cuidado, tiene historial de fallos."}` : ""}
            
            PROTOCOLOS CRÍTICOS:
            1. Analiza el sentimiento: Si el cliente está agresivo, frustrado o te pregunta algo que NO PUEDES resolver tú solo, incluye el tag [HUMAN_REQUIRED] al final de tu respuesta (internamente).
            2. Si preguntan por su pedido, sé ultra-preciso con los estados.
            3. No inventes datos que no están en el contexto.
            4. Canal: ${channel}. Mantén la brevedad adecuada al medio.
        `;

        // 5. Ask Gemini
        const aiResponse = await askGemini(content, systemPrompt);
        let text = aiResponse.text || "Lo siento, tengo un micro-corte en mi red neuronal. Dame un segundo.";

        // 6. Record Execution & Action
        const latency = Date.now() - startTime;
        const run = await AgentRouter.recordRun({
            agentProfileId: agent.id,
            storeId,
            context: `order:${order?.id || 'none'}`,
            input: content,
            output: text,
            latency
        });

        // 7. Check for Human Intervention Need
        const needsHuman = text.includes("[HUMAN_REQUIRED]") || content.toLowerCase().includes("hablar con una persona") || content.toLowerCase().includes("estafa");
        text = text.replace("[HUMAN_REQUIRED]", "").trim();

        if (needsHuman) {
            await AgentRouter.recordAction({
                agentRunId: run.id,
                agentProfileId: agent.id,
                storeId,
                actorType: 'IA',
                actionType: 'HUMAN_ESC_REQUIRED',
                details: { reason: 'sentiment_or_explicit_request' }
            });
        }

        // 8. Send Response
        const { sendOfficialWhatsApp } = await import("./whatsapp-service");
        await sendOfficialWhatsApp({
            phoneNumber: order?.customerPhone || customerId,
            content: text,
            category: 'SERVICE',
            orderId: order?.id,
            storeId,
            whatsappAccountId: whatsappAccountId,
            isAi: true
        });

        // Record WhatsApp Action
        await AgentRouter.recordAction({
            agentRunId: run.id,
            agentProfileId: agent.id,
            storeId,
            actorType: 'IA',
            actionType: 'SEND_MESSAGE',
            details: { channel, to: customerId }
        });

        return text;
    } catch (error) {
        console.error("[CLOWDBOT ENGINE ERROR]:", error);
        return "Disculpa las molestias, estamos optimizando el sistema. En breve te atenderemos.";
    }
}

/**
 * Clowdbot Moderation Logic
 */
export async function moderateComment(storeId: string, commentId: string, content: string, source: 'FACEBOOK' | 'INSTAGRAM') {
    const startTime = Date.now();
    try {
        const agent = await AgentRouter.route('COMMENT', { storeId, source, commentId });
        if (!agent || !(agent as any).isActive) return null;

        const systemPrompt = `
            Eres ${(agent as any).name}, especialista en MODERACIÓN.
            
            INSTRUCCIONES:
            ${(agent as any).instructions}
            
            TU TAREA:
            Clasifica el comentario en: [QUESTION, OBJECTION, INSULT, SPAM, POSITIVE].
            Si es INSULT o SPAM, responde internamente [ACTION:HIDE].
            Si es QUESTION o OBJECTION, responde con una respuesta corta y vendedora, e incluye [ACTION:RESPOND].
            
            Comentario: "${content}"
        `;

        const aiResponse = await askGemini(content, systemPrompt);
        const text = aiResponse.text || "";

        const run = await AgentRouter.recordRun({
            agentProfileId: agent.id,
            storeId,
            context: `comment:${commentId}`,
            input: content,
            output: text,
            latency: Date.now() - startTime
        });

        // Parse Action
        if (text.includes("[ACTION:HIDE]")) {
            await AgentRouter.recordAction({
                agentRunId: run.id,
                agentProfileId: agent.id,
                storeId,
                actorType: 'IA',
                actionType: 'HIDE_COMMENT',
                details: { commentId, source }
            });
        } else if (text.includes("[ACTION:RESPOND]")) {
            await AgentRouter.recordAction({
                agentRunId: run.id,
                agentProfileId: agent.id,
                storeId,
                actorType: 'IA',
                actionType: 'RESPOND_COMMENT',
                details: { commentId, source, response: text.replace("[ACTION:RESPOND]", "").trim() }
            });
        }

        return text;
    } catch (e) {
        console.error("[MODERATION ERROR]", e);
        return null;
    }
}
