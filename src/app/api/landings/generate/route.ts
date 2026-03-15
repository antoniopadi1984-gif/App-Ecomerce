import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AiRouter } from '@/lib/ai/router';
import { TaskType } from '@/lib/ai/providers/interfaces';
import { uploadTextToDrive } from '@/lib/services/drive-service';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
    const { productId, storeId, template, referenceUrl } = await req.json();
    if (!productId || !storeId) return NextResponse.json({ error: 'productId y storeId requeridos' }, { status: 400 });

    // 1. Cargar research
    const steps = await (prisma as any).researchStep?.findMany({
        where: { productId },
        orderBy: { createdAt: 'desc' }
    }) || [];

    const p1 = steps.find((s: any) => s.stepKey === 'P1');
    const p2 = steps.find((s: any) => s.stepKey === 'P2');
    const p4 = steps.find((s: any) => s.stepKey === 'P4');

    // 2. Cargar producto
    const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { title: true, description: true, price: true, imageUrl: true }
    });

    // 3. Si referenceUrl, analizar primero
    let referenceAnalysis = null;
    if (referenceUrl) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const refRes = await fetch(`${appUrl}/api/landings/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Store-Id': storeId },
            body: JSON.stringify({ url: referenceUrl, productId, storeId })
        }).then(r => r.json());
        referenceAnalysis = refRes.analysis;
    }

    // 4. Parsear research steps de forma segura
    const parseStep = (step: any) => {
        try { return JSON.parse(step?.outputText || '{}'); } catch { return {}; }
    };

    // 5. Generar landing con IA
    const result = await AiRouter.dispatch(
        storeId,
        TaskType.RESEARCH_DEEP,
        `Genera HTML completo de landing page de alta conversión para:

Producto: ${product?.title}
Precio: ${product?.price}
Avatar principal: ${JSON.stringify(parseStep(p2))}
Ángulo: ${JSON.stringify(parseStep(p4))}
Mecanismo único: ${parseStep(p1)?.unique_mechanism || 'No disponible'}
${referenceAnalysis ? `Referencia de landing competidora: ${JSON.stringify(referenceAnalysis)}` : ''}

REQUISITOS:
- HTML completo con CSS inline (sin dependencias externas)
- Estructura: Hero → Problema → Mecanismo → Prueba → Oferta → Garantía → CTA
- Mobile-first, ratio conversión máximo
- Incluir placeholder para imagen del producto: {{IMAGE_URL}}
- Devuelve SOLO el HTML, sin explicaciones`,
        {}
    );

    // 6. Insertar imagen real
    const finalHtml = result.text.replace(/\{\{IMAGE_URL\}\}/g, product?.imageUrl || '');

    // 7. Guardar en Drive
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `LANDING_${(product?.title || 'producto').replace(/\s+/g, '_')}_${timestamp}.html`;

    const driveResult = await uploadTextToDrive(
        productId, storeId, fileName, finalHtml,
        { subfolderName: '05_LANDINGS' }
    );

    return NextResponse.json({
        ok: true,
        html: finalHtml,
        fileName,
        driveUrl: driveResult.driveUrl,
        driveFileId: driveResult.driveFileId
    });
}
