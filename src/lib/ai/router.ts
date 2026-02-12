
import { prisma } from "../prisma";
import { TaskType, AIResponse } from "./providers/interfaces";
import { agentDispatcher } from "../agents/agent-dispatcher";
import { AgentRole } from "../agents/agent-registry";

// Mapeo de TaskType a AgentRole (Tiered Architecture)
const TASK_TO_AGENT: Record<string, AgentRole> = {
    [TaskType.RESEARCH_DEEP]: 'research-lab',
    [TaskType.RESEARCH_FAST]: 'general',
    [TaskType.COPY_LONGFORM]: 'copywriter-elite',
    [TaskType.COPY_SHORT]: 'copywriter-elite',
    [TaskType.SCRIPT_VIDEO]: 'script-generator',
    [TaskType.COPYWRITING_DEEP]: 'copywriter-elite',
    [TaskType.COPYWRITING_PAGES]: 'landing-creator',
    [TaskType.SCRIPTS_ADVANCED]: 'script-generator',
    [TaskType.CRO_AUDIT]: 'cro-optimizer',
    [TaskType.RESEARCH_FORENSIC]: 'competitor-analyst',
    // Operaciones (Mapeo de strings si no están en Enum)
    'CUSTOMER_SUPPORT': 'customer-support',
    'CART_RECOVERY': 'cart-recovery',
    'ORDER_TRACKING': 'order-tracker',
    'SHIPPING_ALERT': 'shipping-alert',
    'INCIDENT_MANAGE': 'incident-manager',
    'DAILY_ACCOUNTING': 'daily-accountant',
    'METRICS_ANALYSIS': 'metrics-analyzer',
    'PERFORMANCE_TRACK': 'performance-tracker',
    'DRIVE_ORGANIZE': 'drive-organizer',
    'LEAD_NURTURE': 'lead-nurturer',
    'EBOOK_WRITE': 'ebook-writer',
    'OFFER_CONFIG': 'offer-configurator'
};

export class AiRouter {

    static async dispatch(
        storeId: string,
        task: TaskType | string,
        prompt: string,
        options: {
            images?: string[],
            systemPrompt?: string,
            jsonSchema?: any,
            context?: string
        } = {}
    ): Promise<AIResponse> {

        // 1. Check Budget & Mode
        const budget = await prisma.aiBudget.findFirst({
            where: { storeId: storeId }
        });

        if (budget && budget.dailyLimitEur > 0 && budget.currentUsage >= budget.dailyLimitEur) {
            if (budget.hardStop) {
                throw new Error("AI Budget Exceeded (Hard Stop)");
            }
        }

        // 2. Determinar agente
        const taskKey = task;
        const agentRole = TASK_TO_AGENT[taskKey] || 'general';

        console.log(`[AiRouter] Task: ${taskKey} → Agent: ${agentRole}`);

        // 3. Execute via Dispatcher
        const start = Date.now();
        let error: string | undefined;
        let result: any;

        try {
            // Nota: El dispatcher actual no maneja vision aún, pero lo derivamos
            result = await agentDispatcher.dispatch({
                role: agentRole,
                prompt: prompt,
                context: options.context || options.systemPrompt, // Legacy bridge
                taskDescription: taskKey,
                jsonSchema: !!options.jsonSchema
            });
        } catch (e: any) {
            error = e.message;
            throw e;
        } finally {
            const duration = Date.now() - start;

            // 4. Log Usage & Costs
            try {
                const costEur = result?.cost || 0;

                await prisma.aiUsageLog.create({
                    data: {
                        storeId,
                        provider: result?.provider || "UNKNOWN",
                        model: result?.model || "UNKNOWN",
                        taskType: taskKey,
                        inputTokens: result?.usage?.promptTokens || 0,
                        outputTokens: result?.usage?.completionTokens || 0,
                        estimatedCostEur: costEur,
                        latencyMs: duration,
                        status: error ? "ERROR" : "SUCCESS",
                        error: error
                    }
                });

                // Update Budget Current Usage
                if (costEur > 0 && budget) {
                    await prisma.aiBudget.update({
                        where: { id: budget.id },
                        data: { currentUsage: { increment: costEur } }
                    });
                }
            } catch (logParams) {
                console.error("Failed to log AI usage", logParams);
            }
        }

        return {
            text: result.text,
            usage: {
                inputTokens: result.usage?.promptTokens || 0,
                outputTokens: result.usage?.completionTokens || 0,
                costEur: result.cost || 0
            },
            raw: result
        };
    }
}
