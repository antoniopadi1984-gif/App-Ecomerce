import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AgentId } from '@prisma/client';
import { aiGateway } from '@/lib/ai/gateway';
import { getAgentSystemPrompt } from '@/lib/agents/agent-utils';

/**
 * Mapeo de AgentId a modelo correcto según tabla 7.2
 */
function getModelForAgent(agentId: AgentId): string {
    const proModels: AgentId[] = [
        AgentId.INVESTIGACION,
        AgentId.CREATIVO,
        AgentId.MARKETING,
        AgentId.DIRECTOR_MARKETING,
        AgentId.ESPECIALISTA_CREATIVO,
        AgentId.DIRECTOR
    ];

    if (proModels.includes(agentId)) {
        return "gemini-3.1-pro-preview";
    }

    return "gemini-3-flash-preview";
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { storeId, agentId, message, context, history = [] } = body;

        if (!storeId || !agentId || !message) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Buscar AgentConfig o crear con default
        let agentConfig = await prisma.agentConfig.findUnique({
            where: {
                storeId_agentId: {
                    storeId,
                    agentId: agentId as AgentId
                }
            }
        });

        if (!agentConfig) {
            const defaultPrompt = await getAgentSystemPrompt(storeId, agentId);
            agentConfig = await prisma.agentConfig.create({
                data: {
                    storeId,
                    agentId: agentId as AgentId,
                    systemPrompt: defaultPrompt
                }
            });
        }

        // 2. Resolver modelo
        const model = getModelForAgent(agentId as AgentId);

        // 3. Construir system prompt y user prompt
        // Incorporamos el contexto al mensaje principal
        let processedMessage = message;
        if (context) {
            processedMessage = `CONTEXTO:\n${typeof context === 'string' ? context : JSON.stringify(context, null, 2)}\n\nNUEVO_MENSAJE:\n${message}`;
        }

        // 4. Llamar a Gemini via AI Gateway
        // Nota: Incluimos el historial si el gateway lo soporta o concatenamos
        // Por ahora, asumimos que runText hace una llamada simple
        const response = await aiGateway.runText({
            modelHint: model,
            prompt: processedMessage,
            systemPrompt: agentConfig.systemPrompt,
            temperature: 0.7
        });

        // 5. Vincular perfil de agente (AgentProfile)
        let agentProfile = await prisma.agentProfile.findFirst({
            where: { storeId, role: agentId.toString() }
        });

        if (!agentProfile) {
            agentProfile = await prisma.agentProfile.create({
                data: {
                    storeId,
                    name: `Agente: ${agentId}`,
                    role: agentId.toString(),
                    model: model,
                    isActive: true
                }
            });
        }

        // 6. Guardar en AgentRun
        const run = await prisma.agentRun.create({
            data: {
                storeId,
                agentProfileId: agentProfile.id,
                input: message,
                output: response.text,
                status: "SUCCESS"
            }
        });

        // 7. Devolver respuesta
        return NextResponse.json({
            response: response.text,
            agentId,
            runId: run.id
        });

    } catch (error: any) {
        console.error("[API Agents Chat] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
