import { NextRequest, NextResponse } from 'next/server';
import { agentDispatcher } from '@/lib/agents/agent-dispatcher';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { role, prompt, context, storeId, configOverride } = body;

        if (!role || !prompt) {
            return NextResponse.json({ error: "Missing role or prompt" }, { status: 400 });
        }

        console.log(`[Agent API] Running agent: ${role} for store: ${storeId || 'none'}`);

        // Result from dispatcher
        const result = await agentDispatcher.dispatchAuto(
            prompt,
            prompt,
            context
        );

        // Track run if storeId provided
        if (storeId) {
            await (prisma as any).agentRun.create({
                data: {
                    storeId,
                    agentRole: role,
                    prompt,
                    response: result.text,
                    tokens: result.usage?.totalTokens || 0,
                    cost: 0,
                    status: 'COMPLETED',
                    createdAt: new Date()
                }
            });
        }

        // Auto-trigger contenido digital si el agente es de creación de contenido
        if (storeId && ['voice-director', 'script-writer', 'packaging-designer'].includes(role)) {
            try {
                await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/content/generate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-Store-Id': storeId },
                    body: JSON.stringify({
                        productId: context?.productId,
                        type: role === 'voice-director' ? 'audio_course' : 'ebook',
                        topic: prompt.slice(0, 100),
                        storeId,
                    })
                }).catch(() => {}); // fire and forget
            } catch {}
        }

        return NextResponse.json({ success: true, result });
    } catch (e: any) {
        console.error("🛑 [Agent API Error]", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
