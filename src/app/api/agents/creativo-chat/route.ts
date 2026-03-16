import { NextRequest, NextResponse } from 'next/server';
import { AiRouter } from '@/lib/ai/router';
import { TaskType } from '@/lib/ai/providers/interfaces';

export async function POST(req: NextRequest) {
    try {
        const { message, context, history, storeId } = await req.json();
        if (!message) return NextResponse.json({ error: 'message required' }, { status: 400 });

        const systemPrompt = `Eres un experto en creatividad publicitaria y marketing de respuesta directa.
Tu función es ayudar a crear, analizar y mejorar creativos publicitarios para ecommerce.
Conoces los conceptos C1-C9 (Problema, Falsa Solución, Mecanismo, Prueba, Autoridad, Historia, Identidad, Resultado, Oferta).
Contexto del producto: ${JSON.stringify(context || {})}.
Responde en español de forma concisa y accionable.`;

        const conversationHistory = (history || []).map((h: any) => 
            `${h.role === 'user' ? 'Usuario' : 'Asistente'}: ${h.content}`
        ).join('\n');

        const result = await router.route({
            taskType: TaskType.COPY_SHORT,
            prompt: conversationHistory ? 
                `Historial:\n${conversationHistory}\n\nNueva pregunta: ${message}` : 
                message,
            systemPrompt,
            model: process.env.GEMINI_MODEL_FAST || 'gemini-2.5-flash-lite',
        });

        return NextResponse.json({ 
            success: true, 
            response: result.text,
            tokensUsed: result.tokensUsed 
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
