import { NextRequest, NextResponse } from 'next/server';
import { generateCopy } from '@/lib/replicate-client';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const { productId, storeId, angle, tone, language } = await req.json();

        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });

        const landingCopy = await generateCopy({
            task: 'landing',
            productTitle: product.title,
            productDescription: product.description || '',
            angle,
            tone,
            language: language || 'es',
        });

        // Parse secciones del copy
        const sections: Record<string, string> = {};
        const sectionKeys = ['HERO', 'PROBLEMA', 'MECANISMO', 'PRUEBA', 'OFERTA', 'GARANTIA', 'FAQ', 'CTA'];
        for (const key of sectionKeys) {
            const regex = new RegExp(`${key}[:\\s]*([\\s\\S]*?)(?=${sectionKeys.join('|')}|$)`, 'i');
            const match = landingCopy.match(regex);
            if (match) sections[key.toLowerCase()] = match[1].trim();
        }

        return NextResponse.json({
            success: true,
            raw: landingCopy,
            sections,
            productTitle: product.title,
        });
    } catch (error: any) {
        console.error('[landing-copy]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
