
import { prisma } from "../prisma";
import { TaskType, AIResponse } from "./providers/interfaces";
import { agentDispatcher } from "../agents/agent-dispatcher";
import { AgentRole } from "../agents/agent-registry";

// Mapeo de TaskType a AgentRole (Tiered Architecture)
const TASK_TO_AGENT: Record<string, AgentRole> = {
    [TaskType.RESEARCH_DEEP]:     'research-core',
    [TaskType.RESEARCH_FAST]:     'general',
    [TaskType.VISION_PRODUCT]:    'research-core',
    [TaskType.COPY_LONGFORM]:     'funnel-architect',
    [TaskType.COPY_SHORT]:        'funnel-architect',
    [TaskType.SCRIPT_VIDEO]:      'video-intelligence',
    [TaskType.CREATIVE_FORENSIC]: 'video-intelligence',
    [TaskType.COPYWRITING_DEEP]:  'funnel-architect',
    [TaskType.COPYWRITING_PAGES]: 'funnel-architect',
    [TaskType.SCRIPTS_ADVANCED]:  'video-intelligence',
    [TaskType.CRO_AUDIT]:         'funnel-architect',
    [TaskType.RESEARCH_FORENSIC]: 'research-core',
    [TaskType.PERFORMANCE_ADS]:   'media-buyer',
    [TaskType.IMAGE_ASSETS]:      'image-director',
    
    // Operaciones
    'CUSTOMER_SUPPORT':  'ops-commander',
    'CART_RECOVERY':     'ops-commander',
    'ORDER_TRACKING':    'ops-commander',
    'SHIPPING_ALERT':    'ops-commander',
    'INCIDENT_MANAGE':   'ops-commander',
    'DAILY_ACCOUNTING':  'ops-commander',
    'METRICS_ANALYSIS':  'media-buyer',
    'PERFORMANCE_TRACK': 'media-buyer',
    'DRIVE_ORGANIZE':    'drive-intelligence',
    'LEAD_NURTURE':      'ops-commander',
    'EBOOK_WRITE':       'funnel-architect',
    'OFFER_CONFIG':      'funnel-architect'
};

export class AiRouter {

    static async dispatch(
        storeId: string,
        task: TaskType | string,
        prompt: string,
        options: {
            images?: string[],
            video?: string,
            videoMimeType?: string,
            videoFileUri?: string,
            model?: string,
            systemPrompt?: string,
            systemPromptOverride?: string,  // alias que toma prioridad sobre systemPrompt
            jsonSchema?: any,
            context?: string,
            locale?: string
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
                images: options.images,
                video: options.video,
                videoMimeType: options.videoMimeType,
                videoFileUri: options.videoFileUri,
                model: options.model,
                context: options.context || options.systemPromptOverride || options.systemPrompt, // systemPromptOverride > systemPrompt
                systemPromptOverride: options.systemPromptOverride || options.systemPrompt, // pasar al dispatcher
                taskDescription: taskKey as string,
                jsonSchema: !!options.jsonSchema,
                locale: options.locale
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

    static async dispatchToAgent(
        agentRole: AgentRole,
        storeId: string,
        userMessage: string,
        context?: Record<string, any>
    ): Promise<AIResponse> {
        const contextStr = context ? `\n\nCONTEXTO DISPONIBLE:\n${JSON.stringify(context, null, 2)}` : '';
        const result = await agentDispatcher.dispatch({
            role: agentRole,
            prompt: userMessage + contextStr
        });

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
