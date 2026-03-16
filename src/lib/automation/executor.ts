/**
 * AUTOMATION EXECUTOR
 * Evalúa las reglas activas de una tienda y ejecuta las acciones correspondientes.
 * Se llama desde: webhooks (order created/updated), cron jobs, y manualmente.
 */
import prisma from "@/lib/prisma";
import { sendNotification } from "@/lib/notifications";
import { agentDispatcher } from "@/lib/agents/agent-dispatcher";

export type AutomationTrigger =
  | "ORDER_CREATED"
  | "TRACKING_ADDED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED_D3"
  | "DELIVERED_D7"
  | "DELIVERED_D14"
  | "PAYMENT_CONFIRMED"
  | "ORDER_CANCELLED"
  | "INCIDENCE_DETECTED";

export async function executeAutomations(
  storeId: string,
  trigger: AutomationTrigger,
  orderId: string,
  context?: Record<string, any>
): Promise<{ executed: number; errors: string[] }> {
  const errors: string[] = [];
  let executed = 0;

  try {
    // 1. Obtener reglas activas para este trigger
    const rules = await (prisma as any).automationRule.findMany({
      where: { storeId, isEnabled: true },
    });

    const activeRules = rules.filter((r: any) => {
      // Mapear ruleId al trigger
      const triggerMap: Record<string, AutomationTrigger> = {
        auto_confirmation: "ORDER_CREATED",
        auto_tracking:     "TRACKING_ADDED",
        auto_delivery:     "OUT_FOR_DELIVERY",
        postv_d3:          "DELIVERED_D3",
        postv_d7:          "DELIVERED_D7",
        postv_d14:         "DELIVERED_D14",
      };
      return triggerMap[r.ruleId] === trigger;
    });

    if (activeRules.length === 0) return { executed: 0, errors: [] };

    // 2. Obtener orden
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { store: true },
    });
    if (!order) return { executed: 0, errors: ["Order not found"] };

    // 3. Ejecutar cada regla activa
    for (const rule of activeRules) {
      try {
        const actionMap: Record<string, () => Promise<void>> = {
          auto_confirmation: async () => {
            await sendNotification(orderId, "CONFIRMATION", "WHATSAPP");
          },
          auto_tracking: async () => {
            await sendNotification(orderId, "TRACKING", "WHATSAPP");
          },
          auto_delivery: async () => {
            await sendNotification(orderId, "OUT_FOR_DELIVERY", "WHATSAPP");
          },
          postv_d3: async () => {
            // Enviar ebook/contenido digital D+3
            if (process.env.NEXT_PUBLIC_APP_URL) {
              await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/content/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-Store-Id": storeId },
                body: JSON.stringify({
                  productId: (order as any).productId,
                  type: "ebook",
                  topic: `Guía de uso de ${(order as any).productTitle || "tu producto"}`,
                  storeId,
                }),
              }).catch(() => {});
            }
          },
          postv_d7: async () => {
            await sendNotification(orderId, "DELIVERED", "WHATSAPP");
          },
          postv_d14: async () => {
            // Upsell — enviar oferta personalizada via IA
            const upsellMsg = await agentDispatcher.dispatch({
              role: "ops-commander",
              prompt: `Genera un mensaje de WhatsApp de upsell para el cliente ${(order as any).customerName} que compró ${(order as any).productTitle} hace 14 días. Máximo 160 caracteres. Solo el mensaje, sin explicaciones.`,
              storeId,
            });
            if (upsellMsg.text) {
              await sendNotification(orderId, "DELIVERED", "WHATSAPP");
            }
          },
        };

        const action = actionMap[rule.ruleId];
        if (action) {
          await action();
          executed++;
          console.log(`[Automation] ✅ ${rule.ruleId} → executed for order ${orderId}`);
        }
      } catch (ruleErr: any) {
        errors.push(`${rule.ruleId}: ${ruleErr.message}`);
        console.error(`[Automation] ❌ ${rule.ruleId}:`, ruleErr.message);
      }
    }

    // 4. Registrar ejecución en BD
    await (prisma as any).agentRun.create({
      data: {
        storeId,
        agentProfileId: "automation-executor",
        input: `${trigger} for order ${orderId}`,
        output: `Executed: ${executed}, Errors: ${errors.length}`,
        status: errors.length === 0 ? "SUCCESS" : "PARTIAL",
      },
    }).catch(() => {});

  } catch (e: any) {
    errors.push(e.message);
  }

  return { executed, errors };
}

/**
 * Programar automatizaciones diferidas (D+3, D+7, D+14)
 * Se llama cuando un pedido cambia a DELIVERED
 */
export async function schedulePostDeliveryAutomations(
  storeId: string,
  orderId: string
): Promise<void> {
  const delays = [
    { ruleId: "postv_d3",  trigger: "DELIVERED_D3"  as AutomationTrigger, days: 3  },
    { ruleId: "postv_d7",  trigger: "DELIVERED_D7"  as AutomationTrigger, days: 7  },
    { ruleId: "postv_d14", trigger: "DELIVERED_D14" as AutomationTrigger, days: 14 },
  ];

  for (const d of delays) {
    // Guardar en BD para que el cron los procese
    await (prisma as any).scheduledAutomation.upsert({
      where: { storeId_orderId_ruleId: { storeId, orderId, ruleId: d.ruleId } },
      update: {},
      create: {
        storeId,
        orderId,
        ruleId: d.ruleId,
        trigger: d.trigger,
        scheduledAt: new Date(Date.now() + d.days * 24 * 60 * 60 * 1000),
        status: "PENDING",
      },
    }).catch(() => {});
  }
}
