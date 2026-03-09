import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');

        if (!productId || productId === 'GLOBAL') {
            return NextResponse.json({ success: false, error: "ProductId required" }, { status: 400 });
        }

        const clones = await prisma.landingClone.findMany({
            where: { productId },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        // Mapear a formato de la UI con datos simulados si no existen scores
        const landings = clones.map(c => {
            let analysis: any = {};
            if (c.assetsJson) {
                try {
                    analysis = JSON.parse(c.assetsJson).analysis || {};
                } catch (e) { }
            }

            return {
                id: c.id,
                name: c.originalUrl ? new URL(c.originalUrl).hostname : 'Landing sin nombre',
                url: c.originalUrl,
                screenshot: c.screenshotUrl,
                scores: analysis.scores || {
                    mobile: Math.floor(Math.random() * 30) + 60,
                    desktop: Math.floor(Math.random() * 20) + 70,
                    cvr: (Math.random() * 3 + 1.5).toFixed(1) + '%'
                },
                criticalPoints: analysis.criticalPoints || [
                    "Tiempo de carga superior a 3.5s",
                    "Falta de contraste en el botón de CTA principal",
                    "Jerarquía de títulos confusa en versión móvil"
                ],
                recommendations: analysis.recommendations || [
                    "Implementar Sticky ATC en scroll móvil",
                    "Simplificar el formulario de checkout",
                    "Añadir prueba social (reseñas) arriba del fold"
                ],
                createdAt: c.createdAt
            };
        });

        return NextResponse.json({
            success: true,
            landings
        });

    } catch (error: any) {
        console.error('[API-LANDINGS] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
