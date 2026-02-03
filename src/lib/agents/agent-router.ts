import { prisma } from "@/lib/prisma";
import { AgentProfile, AgentRun, AgentAction } from "@prisma/client";

export type AgentEventType = 'MESSAGE' | 'COMMENT' | 'KPI_ALERT' | 'ORDER_EVENT';

export interface AgentContext {
    storeId: string;
    menu?: string;
    orderId?: string;
    commentId?: string;
    source?: 'WHATSAPP' | 'INBOX' | 'FACEBOOK' | 'INSTAGRAM' | 'FINANCES';
    data?: any;
}

export class AgentRouter {
    /**
     * Finds the best suited agent for a given event and context.
     */
    static async route(event: AgentEventType, context: AgentContext): Promise<AgentProfile | null> {
        const { storeId, menu, source } = context;

        // 1. Fetch all active agents for this store
        const agents = await (prisma as any).agentProfile.findMany({
            where: { storeId, isActive: true }
        });

        if (agents.length === 0) return null;

        // 2. Logic to select agent based on role and context
        // This is a simple priority/mapping logic. 
        // Future versions could use AI for the routing itself.

        // Priority 1: Direct menu mapping
        if (menu) {
            const menuAgent = agents.find(a => {
                const menus = JSON.parse((a as any).menus || '[]');
                return menus.includes(menu);
            });
            if (menuAgent) return menuAgent;
        }

        // Priority 2: Event -> Role mapping
        const eventToRole: Record<AgentEventType, string> = {
            'MESSAGE': 'ATT',
            'COMMENT': 'MODERACION',
            'KPI_ALERT': 'MEDIA_BUYING',
            'ORDER_EVENT': 'RECOVERY'
        };

        const role = eventToRole[event];
        const roleAgent = agents.find(a => a.role === role);
        if (roleAgent) return roleAgent;

        // Fallback: Return the first active agent (usually a generalist if exists)
        return agents[0];
    }

    /**
     * Records an agent execution (Run)
     */
    static async recordRun(data: {
        agentProfileId: string;
        storeId: string;
        context?: string;
        input: string;
        output: string;
        latency?: number;
        status?: string;
        error?: string;
    }) {
        return await (prisma as any).agentRun.create({
            data: {
                agentProfileId: data.agentProfileId,
                storeId: data.storeId,
                context: data.context,
                input: data.input,
                output: data.output,
                latency: data.latency,
                status: data.status || 'SUCCESS',
                error: data.error
            }
        });
    }

    /**
     * Records a specific action (Action/Audit)
     */
    static async recordAction(data: {
        agentRunId?: string;
        agentProfileId?: string;
        storeId: string;
        actorType: 'IA' | 'HUMAN';
        actorId?: string;
        actionType: string;
        details?: any;
        impactMetric?: string;
        impactValue?: number;
    }) {
        const action = await (prisma as any).agentAction.create({
            data: {
                agentRunId: data.agentRunId,
                agentProfileId: data.agentProfileId,
                storeId: data.storeId,
                actorType: data.actorType,
                actorId: data.actorId,
                actionType: data.actionType,
                details: data.details ? JSON.stringify(data.details) : null,
                impactMetric: data.impactMetric,
                impactValue: data.impactValue
            }
        });

        // Also push to generic AuditLog for global history
        // Use a defensive approach for actorType if Prisma types are missing
        await (prisma as any).auditLog.create({
            data: {
                storeId: data.storeId,
                action: data.actionType,
                entity: 'AGENT_ACTION',
                entityId: action.id,
                actorType: data.actorType,
                newValue: data.details ? JSON.stringify(data.details) : null,
                userId: data.actorType === 'HUMAN' ? data.actorId : null
            }
        });

        return action;
    }
}
