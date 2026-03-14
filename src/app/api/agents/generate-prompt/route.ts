import { NextRequest, NextResponse } from 'next/server';
import { agentDispatcher } from '@/lib/agents/agent-dispatcher';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
    const { label, description, module, basePrompt, storeId } = await req.json();

    if (!label) return NextResponse.json({ error: 'label requerido' }, { status: 400 });

    const result = await agentDispatcher.dispatch({
        role: 'neural-mother',
        storeId: storeId || '',
        prompt: `Necesito que generes el system prompt perfecto para un nuevo agente especialista.

DATOS DEL AGENTE:
- Nombre: ${label}
- Módulo: ${module || 'general'}
- Descripción del rol: ${description || 'no especificada'}
${basePrompt ? `- Prompt base del usuario (mejóralo y expándelo):\n${basePrompt}` : ''}

INSTRUCCIONES:
Genera un system prompt de élite para este agente siguiendo estos principios:
1. Definir claramente el dominio de expertise del agente
2. Especificar los frameworks, metodologías y referencias que debe conocer
3. Definir el formato de output (siempre JSON estructurado cuando sea posible)
4. Incluir reglas inamovibles y principios de actuación
5. Especificar cómo debe interactuar con el contexto que recibe

El prompt debe ser tan bueno como los mejores agentes del sistema (FUNNEL_ARCHITECT, VIDEO_INTELLIGENCE, CREATIVE_FORENSIC).

Responde SOLO con el system prompt completo, sin introducciones ni explicaciones.`
    });

    return NextResponse.json({ ok: true, prompt: result.text });
}
