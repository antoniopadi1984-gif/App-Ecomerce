import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { agentDispatcher } from '@/lib/agents/agent-dispatcher';
import { DEFAULT_AGENT_PROMPTS } from '@/lib/ai/defaults/agent-prompts';

export async function POST(req: NextRequest) {
    try {
        const { storeId, agentId, message, context, history = [] } = await req.json();

        if (!storeId || !agentId || !message) {
            return NextResponse.json({ error: 'storeId, agentId y message son requeridos' }, { status: 400 });
        }

        // 1. Buscar config del agente en BD (string libre, no enum)
        let agentConfig = await (prisma as any).agentConfig.findFirst({
            where: { storeId, agentId }
        });

        // 2. Si no existe, buscar en DEFAULT_AGENT_PROMPTS por el agentId
        let systemPrompt = agentConfig?.systemPrompt;
        if (!systemPrompt) {
            // Buscar en prompts por defecto (case insensitive)
            const key = Object.keys(DEFAULT_AGENT_PROMPTS).find(
                k => k.toLowerCase() === agentId.toLowerCase().replace(/-/g, '_')
            );
            systemPrompt = key ? DEFAULT_AGENT_PROMPTS[key] : `Eres un asistente especializado llamado ${agentId}.`;
        }

        // 3. Construir mensaje con historial y contexto
        const contextStr = context
            ? `\n\nCONTEXTO DISPONIBLE:\n${typeof context === 'string' ? context : JSON.stringify(context, null, 2)}`
            : '';

        const historyStr = history.length > 0
            ? '\n\nHISTORIAL PREVIO:\n' + history.map((h: any) => `${h.role === 'user' ? 'Usuario' : 'Agente'}: ${h.content}`).join('\n')
            : '';

        const fullMessage = `${historyStr}${contextStr}\n\nUsuario: ${message}`;

        // 4. Determinar provider y modelo según agentId
        const geminiAgents = ['research-core', 'video-intelligence', 'creative-forensic', 'drive-intelligence', 'INVESTIGACION', 'CREATIVO', 'MARKETING'];
        const isGemini = geminiAgents.some(g => agentId.toUpperCase().includes(g.toUpperCase()));

        const result = await agentDispatcher.dispatch({
            role: isGemini ? 'research-lab' : 'copywriter-elite',
            prompt: fullMessage,
            storeId,
            // Override systemPrompt con el del agente real
            systemPromptOverride: systemPrompt
        } as any);

        // 5. Guardar AgentRun
        await prisma.agentRun.create({
            data: {
                storeId,
                agentProfileId: agentConfig?.id || agentId,
                input: message,
                output: result.text,
                status: 'SUCCESS'
            }
        }).catch(() => {});

        return NextResponse.json({ response: result.text, agentId });

    } catch (error: any) {
        console.error('[Agents Chat]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
