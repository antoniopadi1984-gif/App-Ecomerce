'use server';

import { prisma } from '@/lib/prisma';
import { SPENCER_CORE_KNOWLEDGE, CREATIVE_CONCEPTS, AUDIENCE_TYPES, AWARENESS_LEVELS } from '@/lib/creative/spencer-knowledge';
import { AiRouter } from '@/lib/ai/router';
import { TaskType } from '@/lib/ai/providers/interfaces';

// ============================================================
// AGENT CRUD
// ============================================================

/**
 * Get or create an agent profile for the Centro Creativo.
 * If the agent doesn't exist, it creates one with Spencer knowledge injected.
 */
export async function getOrCreateCreativeAgent(storeId: string, role: string, defaults?: {
    name?: string;
    instructions?: string;
    tone?: string;
    model?: string;
    temperature?: number;
}) {
    try {
        // Try to find existing
        let agent = await (prisma as any).agentProfile.findFirst({
            where: { storeId, role }
        });

        if (!agent) {
            // Create with Spencer knowledge
            agent = await (prisma as any).agentProfile.create({
                data: {
                    storeId,
                    name: defaults?.name || `Agente ${role}`,
                    role,
                    instructions: defaults?.instructions || '',
                    tone: defaults?.tone || 'professional',
                    model: defaults?.model || 'gemini-2.0-flash',
                    temperature: defaults?.temperature || 0.7,
                    systemPrompt: SPENCER_CORE_KNOWLEDGE,
                    isActive: true,
                }
            });
        }

        // Parse examples from instructions JSON
        let examples: AgentExample[] = [];
        try {
            const parsed = JSON.parse(agent.instructions || '{}');
            examples = parsed.examples || [];
        } catch {
            // instructions is plain text, no examples yet
        }

        return {
            id: agent.id,
            name: agent.name,
            role: agent.role,
            instructions: getPlainInstructions(agent.instructions),
            tone: agent.tone,
            model: agent.model,
            temperature: agent.temperature,
            examples,
        };
    } catch (error: any) {
        console.error('[agents-actions] getOrCreateCreativeAgent error:', error);
        throw new Error(`Failed to get/create agent: ${error.message}`);
    }
}

interface AgentExample {
    type: 'url' | 'text' | 'image';
    content: string;
    label?: string;
}

function getPlainInstructions(raw: string): string {
    try {
        const parsed = JSON.parse(raw || '{}');
        return parsed.prompt || raw || '';
    } catch {
        return raw || '';
    }
}

function serializeInstructions(prompt: string, examples: AgentExample[]): string {
    return JSON.stringify({ prompt, examples });
}

/**
 * Update agent's custom prompt (user-editable instructions)
 */
export async function updateAgentPrompt(agentId: string, instructions: string) {
    try {
        const agent = await (prisma as any).agentProfile.findUnique({ where: { id: agentId } });
        if (!agent) throw new Error('Agent not found');

        // Preserve examples
        let examples: AgentExample[] = [];
        try {
            const parsed = JSON.parse(agent.instructions || '{}');
            examples = parsed.examples || [];
        } catch { /* plain text, no examples */ }

        await (prisma as any).agentProfile.update({
            where: { id: agentId },
            data: {
                instructions: serializeInstructions(instructions, examples),
                updatedAt: new Date(),
            }
        });

        return { success: true };
    } catch (error: any) {
        console.error('[agents-actions] updateAgentPrompt error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Add an example reference (URL, text, or image) to an agent
 */
export async function addAgentExample(agentId: string, example: AgentExample) {
    try {
        const agent = await (prisma as any).agentProfile.findUnique({ where: { id: agentId } });
        if (!agent) throw new Error('Agent not found');

        let prompt = '';
        let examples: AgentExample[] = [];
        try {
            const parsed = JSON.parse(agent.instructions || '{}');
            prompt = parsed.prompt || agent.instructions || '';
            examples = parsed.examples || [];
        } catch {
            prompt = agent.instructions || '';
        }

        examples.push(example);

        await (prisma as any).agentProfile.update({
            where: { id: agentId },
            data: {
                instructions: serializeInstructions(prompt, examples),
                updatedAt: new Date(),
            }
        });

        return { success: true, examples };
    } catch (error: any) {
        console.error('[agents-actions] addAgentExample error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Remove an example by index
 */
export async function removeAgentExample(agentId: string, index: number) {
    try {
        const agent = await (prisma as any).agentProfile.findUnique({ where: { id: agentId } });
        if (!agent) throw new Error('Agent not found');

        let prompt = '';
        let examples: AgentExample[] = [];
        try {
            const parsed = JSON.parse(agent.instructions || '{}');
            prompt = parsed.prompt || '';
            examples = parsed.examples || [];
        } catch {
            prompt = agent.instructions || '';
        }

        if (index >= 0 && index < examples.length) {
            examples.splice(index, 1);
        }

        await (prisma as any).agentProfile.update({
            where: { id: agentId },
            data: {
                instructions: serializeInstructions(prompt, examples),
                updatedAt: new Date(),
            }
        });

        return { success: true, examples };
    } catch (error: any) {
        console.error('[agents-actions] removeAgentExample error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get all examples for an agent
 */
export async function getAgentExamples(agentId: string): Promise<AgentExample[]> {
    try {
        const agent = await (prisma as any).agentProfile.findUnique({ where: { id: agentId } });
        if (!agent) return [];

        try {
            const parsed = JSON.parse(agent.instructions || '{}');
            return parsed.examples || [];
        } catch {
            return [];
        }
    } catch (error) {
        console.error('[agents-actions] getAgentExamples error:', error);
        return [];
    }
}

// ============================================================
// GENERATION
// ============================================================

/**
 * Generate content using an agent with Spencer Pawlin context.
 * Combines: system prompt (Spencer) + user prompt + examples + funnel stage + concept
 */
export async function generateWithAgent(params: {
    agentId: string;
    storeId: string;
    context: string;          // Product/brand context
    funnelStage?: string;      // COLD/WARM/HOT/RETARGET
    concept?: number;          // 1-7 (C1-C7)
    awarenessLevel?: string;   // O1-O5
    customPrompt?: string;     // Additional user instructions
}) {
    try {
        const agent = await (prisma as any).agentProfile.findUnique({ where: { id: params.agentId } });
        if (!agent) throw new Error('Agent not found');

        // Build enhanced prompt
        let userInstructions = '';
        let examples: AgentExample[] = [];
        try {
            const parsed = JSON.parse(agent.instructions || '{}');
            userInstructions = parsed.prompt || agent.instructions || '';
            examples = parsed.examples || [];
        } catch {
            userInstructions = agent.instructions || '';
        }

        // Concept context
        const conceptData = params.concept
            ? CREATIVE_CONCEPTS.find(c => c.id === params.concept)
            : null;

        // Audience context
        const audienceData = params.funnelStage
            ? AUDIENCE_TYPES.find(a => a.id === params.funnelStage)
            : null;

        // Awareness context
        const awarenessData = params.awarenessLevel
            ? AWARENESS_LEVELS.find(a => a.id === params.awarenessLevel)
            : null;

        // Build final prompt
        const prompt = `
${params.context}

${params.funnelStage ? `## FASE DEL EMBUDO: ${params.funnelStage} — ${audienceData?.description || ''}` : ''}
${params.concept ? `## CONCEPTO CREATIVO: ${conceptData?.code} ${conceptData?.name} — ${conceptData?.description || ''}` : ''}
${params.awarenessLevel ? `## NIVEL DE CONSCIENCIA: ${params.awarenessLevel} — ${awarenessData?.description || ''}` : ''}

${userInstructions ? `## INSTRUCCIONES ADICIONALES DEL USUARIO:\n${userInstructions}` : ''}

${params.customPrompt ? `## PETICIÓN ESPECÍFICA:\n${params.customPrompt}` : ''}

${examples.length > 0 ? `## EJEMPLOS DE REFERENCIA:\n${examples.map((e, i) => `${i + 1}. [${e.type}] ${e.label || ''}: ${e.content}`).join('\n')}` : ''}
`.trim();

        // Determine task type based on agent role
        const taskType = getTaskTypeForRole(agent.role);

        // Dispatch to AI
        const result = await AiRouter.dispatch(
            params.storeId,
            taskType,
            prompt,
            {
                systemPrompt: agent.systemPrompt || SPENCER_CORE_KNOWLEDGE,
            }
        );

        return {
            success: true,
            text: result.text,
            usage: result.usage,
            agent: {
                id: agent.id,
                name: agent.name,
                role: agent.role,
            },
            context: {
                funnelStage: params.funnelStage,
                concept: params.concept ? conceptData?.name : undefined,
                awarenessLevel: params.awarenessLevel,
            }
        };
    } catch (error: any) {
        console.error('[agents-actions] generateWithAgent error:', error);
        return { success: false, error: error.message };
    }
}

function getTaskTypeForRole(role: string): TaskType | string {
    const roleToTask: Record<string, TaskType | string> = {
        'LANDING_AGENT': TaskType.COPYWRITING_PAGES,
        'STATIC_AGENT': TaskType.COPY_SHORT,
        'VIDEO_AGENT': TaskType.SCRIPT_VIDEO,
        'POSTVENTA_AGENT': 'LEAD_NURTURE',
        'LIBRARY_AGENT': 'DRIVE_ORGANIZE',
        // Fallback to existing roles
        'copywriter-elite': TaskType.COPY_LONGFORM,
        'cro-optimizer': TaskType.CRO_AUDIT,
        'script-generator': TaskType.SCRIPT_VIDEO,
        'landing-creator': TaskType.COPYWRITING_PAGES,
        'video-director': TaskType.SCRIPT_VIDEO,
        'research-lab': TaskType.RESEARCH_DEEP,
    };
    return roleToTask[role] || TaskType.COPY_SHORT;
}
