import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { langInstruction } from '@/lib/translation';

// POST /api/landing-builder/generate
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { productId, storeId, type, mode, linkedCreative, includeGift, sections, marketLang = 'ES' } = body;

        if (!productId) {
            return NextResponse.json({ ok: false, error: 'productId is required' }, { status: 400 });
        }

        // 1. Context Acquisition
        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: { store: true }
        });

        // Load research (Core Research Step P1)
        const research = await prisma.researchStep.findFirst({
            where: { productId, stepKey: 'P1' },
            orderBy: { createdAt: 'desc' }
        });

        // 2. Prepare AI Prompt
        const prompt = `
            Eres un Director Creativo & Copywriter Experto en CRO (Conversion Rate Optimization).
            
            PRODUCTO: ${product?.title}
            OBJECTIVO: Crear una Landing Page de tipo "${type}" enfocada en conversión directa.
            MODO: ${mode}
            
            RESEARCH CORE:
            ${(research?.outputText || '').slice(0, 2000)}
            
            CONFIGURACIÓN:
            - Vincular Creativo: ${linkedCreative ? `SÍ (Hook Activo: ${linkedCreative})` : 'NO'}
            - Incluir Regalo: ${includeGift ? 'SÍ' : 'NO'}
            
            TAREA:
            Genera el copy completo para las siguientes secciones: ${sections.join(', ')}.
            
            REGLAS CRÍTICAS:
            1. MESSAGE MATCH: Si hay un creativo vinculado, el H1 de la landing DEBE ser idéntico al hook del creativo.
            2. PSICOLOGÍA: Usa frameworks de respuesta directa (PAS o AIDA).
            3. ESTRUCTURA: Responde con un objeto JSON donde cada llave es el ID de la sección y el valor es el copy generado.
            
            Responde ÚNICAMENTE en JSON con este formato:
            {
                "sections": [
                    { "name": "HERO", "content": "..." },
                    { "name": "PROBLEM", "content": "..." },
                    ...
                ]
            }
        `;

        // 3. AI Dispatch (Using standard Gemini for now, could use AiRouter)
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
        const model = genAI.getGenerativeModel({ model: 'gemini-3.1-pro-preview' });

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim().replace(/```json\n?|\n?```/g, '');
        const parsed = JSON.parse(text);

        return NextResponse.json({ ok: true, sections: parsed.sections });

    } catch (e: any) {
        console.error('[LandingBuilder] Error:', e);
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
}
