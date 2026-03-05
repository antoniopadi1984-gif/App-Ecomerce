import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const DEFAULT_SYSTEM_PROMPT = `Eres el agente financiero de EcomBoom.
Tienes acceso a los datos financieros en tiempo real del módulo Finanzas.
Analiza los datos, detecta anomalías y da recomendaciones concretas y accionables.
Responde siempre en español, de forma directa y precisa.
Cuando des recomendaciones, priorízalas por impacto económico.
No inventes datos que no estén en el contexto proporcionado.
Para ecommerce COD, benchmarks de referencia:
- Margen neto saludable: ≥ 15% (objetivo 25-35%)
- ROAS mínimo rentable: 2.5x (objetivo 3-4x)
- CPA: debe ser < margen por pedido × tasa entrega
- Gastos fijos: idealmente < 20% sobre ingresos netos`.trim();

export async function POST(req: NextRequest) {
    try {
        const { storeId, messages, context } = await req.json();

        if (!storeId) {
            return NextResponse.json({ error: 'storeId required' }, { status: 400 });
        }

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({
                reply: '⚠️ API Key de Gemini no configurada. Añade GEMINI_API_KEY a tu archivo .env'
            });
        }

        if (!messages || messages.length === 0) {
            return NextResponse.json({ error: 'messages required' }, { status: 400 });
        }

        // Contexto financiero inyectado en el system prompt
        const contextBlock = context
            ? `\n\nDATOS ACTUALES DEL MÓDULO FINANZAS:\n${JSON.stringify(context, null, 2)}`
            : '';

        const systemInstruction = DEFAULT_SYSTEM_PROMPT + contextBlock;

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash-exp',
            systemInstruction,
            generationConfig: {
                maxOutputTokens: 600,
                temperature: 0.6,
            },
        });

        // Construir historial multi-turn (todos los mensajes excepto el último)
        const history = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }],
        }));

        const chat = model.startChat({ history });

        // Enviar el último mensaje del usuario
        const lastMessage = messages[messages.length - 1].content;
        const result = await chat.sendMessage(lastMessage);
        const reply = result.response.text();

        return NextResponse.json({ reply });

    } catch (error: any) {
        console.error('[finanzas-chat] Error:', error);
        return NextResponse.json(
            { reply: '⚠️ Error al conectar con el agente. ' + (error.message || 'Intenta de nuevo.') },
            { status: 500 }
        );
    }
}
