import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { agentDispatcher } from "@/lib/agents/agent-dispatcher";
import { sendOfficialWhatsApp } from "@/lib/whatsapp-service";

export const runtime = "nodejs";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "ecomboom_verify_2026";

/**
 * GET — verificación Meta webhook
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
        return new NextResponse(challenge, { status: 200 });
    }
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/**
 * POST — mensajes entrantes de clientes
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const entry = body?.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const messages = value?.messages;

        if (!messages?.length) return NextResponse.json({ ok: true });

        for (const msg of messages) {
            const from = msg.from; // número del cliente
            const text = msg.type === "text" ? msg.text?.body : `[${msg.type}]`;
            const waId = msg.id;

            // 1. Encontrar la tienda asociada a este número
            const account = await (prisma as any).whatsAppAccount.findFirst({
                where: { isActive: true },
                select: { id: true, storeId: true },
            }).catch(() => null);
            const storeId = account?.storeId || "store-main";

            // 2. Buscar pedido del cliente por teléfono
            const order = await (prisma as any).order.findFirst({
                where: {
                    storeId,
                    customerPhone: { contains: from.slice(-9) }, // últimos 9 dígitos
                },
                orderBy: { createdAt: "desc" },
                select: {
                    id: true, orderNumber: true, status: true,
                    customerName: true, productTitle: true,
                    trackingCode: true, fulfillmentStatus: true,
                },
            }).catch(() => null);

            // 3. Guardar mensaje entrante en BD
            await (prisma as any).message.create({
                data: {
                    orderId: order?.id || null,
                    customerContact: from,
                    sender: "CUSTOMER",
                    content: text || "",
                    channel: "WHATSAPP",
                    status: "RECEIVED",
                    isRead: false,
                    metadata: JSON.stringify({ waId, from, order: order?.orderNumber }),
                },
            }).catch(() => {});

            // 4. Agente IA responde automáticamente
            const context = order
                ? `Cliente: ${order.customerName || from}
Pedido: ${order.orderNumber} | Estado: ${order.status} | Tracking: ${order.trackingCode || "Sin tracking"}
Producto: ${order.productTitle || "Sin info"}`
                : `Cliente: ${from} — No se encontró pedido asociado`;

            const aiResult = await agentDispatcher.dispatch({
                role: "ops-commander",
                prompt: `Un cliente envía este mensaje por WhatsApp: "${text}"
${context}
Responde de forma natural, amable y resolutiva en 1-2 frases máximo.
Si no puedes resolver, di que un agente humano le contactará pronto.
Si es una queja grave o urgente, responde con "ALERTA:" al inicio.`,
                storeId,
            }).catch(() => null);

            if (aiResult?.text) {
                const isAlert = aiResult.text.startsWith("ALERTA:");
                const replyText = aiResult.text.replace(/^ALERTA:\s*/i, "");

                // 5. Enviar respuesta automática
                await sendOfficialWhatsApp({
                    phoneNumber: from,
                    content: replyText,
                    category: "SERVICE",
                    orderId: order?.id,
                    storeId,
                    isAi: true,
                }).catch(() => {});

                // 6. Guardar respuesta en BD
                await (prisma as any).message.create({
                    data: {
                        orderId: order?.id || null,
                        customerContact: from,
                        sender: "AI",
                        content: replyText,
                        channel: "WHATSAPP",
                        status: "SENT",
                        isRead: true,
                        metadata: JSON.stringify({ autoReply: true, isAlert }),
                    },
                }).catch(() => {});

                // 7. Alerta si es grave
                if (isAlert) {
                    await (prisma as any).notification.create({
                        data: {
                            storeId,
                            type: "WHATSAPP_ALERT",
                            title: `⚠️ Alerta WhatsApp — ${order?.orderNumber || from}`,
                            message: `Cliente ${from}: "${text}" → IA detectó urgencia`,
                            isRead: false,
                            metadata: JSON.stringify({ from, orderId: order?.id, originalMsg: text }),
                        },
                    }).catch(() => {});
                }
            }
        }

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        console.error("[WhatsApp Webhook]", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
