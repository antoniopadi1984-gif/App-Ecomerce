import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AiRouter } from '@/lib/ai/router';
import { TaskType } from '@/lib/ai/providers/interfaces';
import { generateEbookPDF } from '@/lib/ebook-engine';

export const maxDuration = 120;
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { storeId, productId, type, avatarId } = body;

        if (!storeId || !type) {
            return NextResponse.json(
                { success: false, error: 'storeId and type are required' },
                { status: 400 }
            );
        }

        const validTypes = ['EBOOK', 'MINICOURSE', 'COUPON', 'BONUS', 'TEMPLATE'];
        if (!validTypes.includes(type)) {
            return NextResponse.json(
                { success: false, error: `type must be one of: ${validTypes.join(', ')}` },
                { status: 400 }
            );
        }

        // Load product context for research-based generation
        let productContext = '';
        if (productId) {
            const product = await prisma.product.findUnique({
                where: { id: productId },
                include: {
                    researchRuns: {
                        where: { status: 'READY' },
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                    },
                },
            }) as any;

            if (product) {
                productContext = `Producto: ${product.title}\nDescripción: ${product.description || ''}\n`;
                const latestRun = product.researchRuns?.[0];
                if (latestRun?.results) {
                    try {
                        const research = JSON.parse(latestRun.results);
                        productContext += `Dolor principal: ${research.voc?.pain_stack?.[0]?.pain || ''}\n`;
                        productContext += `Deseo principal: ${research.voc?.desires?.[0]?.name || ''}\n`;
                        productContext += `Mecanismo único: ${research.product_core?.solution_mechanism?.unique_method || ''}\n`;
                    } catch { }
                }
            }
        }

        // Build generation prompt based on type
        const prompts: Record<string, string> = {
            EBOOK: `Genera un ebook completo de alto valor percibido para el siguiente producto de ecommerce.
${productContext}
El ebook debe tener:
- Título impactante (máximo 10 palabras)
- Subtítulo
- 5-7 capítulos con título y 3-5 puntos por capítulo
- Conclusión y CTA
Responde en JSON: { title, subtitle, chapters: [{title, points: []}], conclusion, cta }`,

            MINICOURSE: `Genera un mini-curso en video de 5 módulos para el siguiente producto.
${productContext}
Cada módulo debe tener título, objetivo y 3 lecciones cortas.
Responde en JSON: { title, subtitle, modules: [{title, objective, lessons: []}] }`,

            COUPON: `Genera una estrategia de cupón con alto impacto psicológico para el siguiente producto.
${productContext}
Responde en JSON: { code, discount_type, discount_value, headline, subheadline, urgency_text, conditions }`,

            BONUS: `Genera una lista de 5 bonuses irresistibles para añadir como valor percibido al siguiente producto.
${productContext}
Responde en JSON: { bonuses: [{ name, value_perceived, description, why_valuable }] }`,

            TEMPLATE: `Genera una plantilla de alta utilidad relacionada con el siguiente producto.
${productContext}
Responde en JSON: { title, description, sections: [{name, fields: []}] }`,
        };

        // Create initial record in GENERATING state
        const record = await ((prisma as any).perceivedValue).create({
            data: {
                storeId,
                productId: productId || null,
                type,
                title: `Generando ${type}...`,
                avatarId: avatarId || null,
                status: 'GENERATING',
            },
        });

        // Fire and forget AI generation
        setImmediate(async () => {
            try {
                if (type === 'EBOOK') {
                    const product = await prisma.product.findUnique({ where: { id: productId || '' }, select: { title: true } }) as any;
                    const ebookResult = await generateEbookPDF({
                      title: `Guía Maestra: ${product ? product.title : 'Tu Producto'}`,
                      productName: product?.title || 'Producto',
                      theme: 'Maximizar resultados con tu compra',
                      targetAudience: 'Clientes recientes',
                      tone: 'EDUCA',
                      storeId, productId: productId || ''
                    });
                    
                    if (!ebookResult.success) {
                        throw new Error(ebookResult.error || 'Failed to generate ebook');
                    }

                    await ((prisma as any).perceivedValue).update({
                      where: { id: record.id },
                      data: { title: ebookResult.fileName, pagesJson: JSON.stringify({ driveFileId: ebookResult.driveFileId }), status: 'READY' }
                    });
                    return;
                }

                const result = await AiRouter.dispatch(
                    storeId,
                    TaskType.COPYWRITING_DEEP,
                    prompts[type],
                    { jsonSchema: true }
                );

                let parsed: any = {};
                try {
                    const clean = result.text.replace(/```json\s*/g, '').replace(/```/g, '').trim();
                    parsed = JSON.parse(clean);
                } catch {
                    parsed = { raw: result.text };
                }

                const title = parsed.title || `${type} generado`;

                await ((prisma as any).perceivedValue).update({
                    where: { id: record.id },
                    data: {
                        title,
                        pagesJson: JSON.stringify(parsed),
                        status: 'READY',
                    },
                });
            } catch (err: any) {
                console.error('[perceived-value/generate] AI error:', err);
                await ((prisma as any).perceivedValue).update({
                    where: { id: record.id },
                    data: { status: 'GENERATING', title: `Error: ${err.message}` },
                }).catch(() => { });
            }
        });

        return NextResponse.json({
            success: true,
            id: record.id,
            status: 'GENERATING',
            message: `Generando ${type}. Puedes consultar el estado en /api/perceived-value/${record.id}`,
        });

    } catch (error: any) {
        console.error('[perceived-value/generate] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Error interno' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const storeId = searchParams.get('storeId');
        const productId = searchParams.get('productId');

        if (!storeId) {
            return NextResponse.json({ success: false, error: 'storeId required' }, { status: 400 });
        }

        const items = await ((prisma as any).perceivedValue).findMany({
            where: {
                storeId,
                ...(productId ? { productId } : {}),
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        return NextResponse.json({ success: true, items });

    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
