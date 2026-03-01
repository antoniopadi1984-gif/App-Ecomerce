import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { langInstruction } from '@/lib/translation';

// POST /api/landing-builder/generate
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { productId, storeId, struct, framework, angle, sections, marketLang = 'ES' } = body;

        if (!productId || !sections?.length) {
            return NextResponse.json({ ok: false, error: 'productId and sections required' }, { status: 400 });
        }

        // Load product context
        const product = await (prisma as any).product.findUnique({
            where: { id: productId },
            select: { title: true, niche: true, description: true, pvpEstimated: true }
        });

        // Load the latest research
        const research = await (prisma as any).researchStep.findFirst({
            where: { productId, stepKey: 'P1' },
            select: { outputText: true },
            orderBy: { createdAt: 'desc' }
        });

        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
        const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.0-flash' });

        const langNote = langInstruction(marketLang);
        const frameworkNotes: Record<string, string> = {
            CASHVERTISING: 'Usa las 8 Life Force Drives de Cashvertising. Tono directo, emocional, urgente. Múltiples call-to-action.',
            BREAKTHROUGH: 'Usa el framework de Breakthrough Advertising. Conecta con el estado de awareness del avatar. Construye deseo progresivamente.',
            HORMOZI: 'Usa la Value Equation de Hormozi. Maximiza el sueño, minimiza esfuerzo y tiempo. Oferta irresistible.',
        };

        const generatedSections = await Promise.all(
            sections.map(async (sectionName: string) => {
                const prompt = `Eres un copywriter de élite especializado en ecommerce de alto rendimiento.

Producto: ${product?.title ?? ''}
Nicho: ${product?.niche ?? ''}
PVP: ${product?.pvpEstimated ?? ''}€
Descripción: ${product?.description ?? ''}
Ángulo/Vector: ${angle || 'Mecanismo único del producto'}
Estructura: ${struct}
Framework: ${frameworkNotes[framework] ?? framework}
Research disponible: ${(research?.outputText ?? '').slice(0, 1000)}

Genera la sección: **${sectionName}**

${frameworkNotes[framework]}

Genera:
1. content: el copy completo de la sección (persuasivo, en idioma del mercado)
2. liquid: el código Liquid/HTML básico para Shopify (sencillo, funcional)

Responde con JSON:
{"content": "...", "liquid": "<section>...</section>"}
${langNote}`;

                try {
                    const result = await model.generateContent(prompt);
                    const text = result.response.text().trim().replace(/```json\n?|\n?```/g, '');
                    const parsed = JSON.parse(text);
                    return {
                        name: sectionName,
                        content: parsed.content ?? '',
                        liquid: parsed.liquid ?? '',
                        lang: marketLang,
                    };
                } catch {
                    return { name: sectionName, content: `[Error generando ${sectionName}]`, lang: marketLang };
                }
            })
        );

        return NextResponse.json({ ok: true, sections: generatedSections });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
}
