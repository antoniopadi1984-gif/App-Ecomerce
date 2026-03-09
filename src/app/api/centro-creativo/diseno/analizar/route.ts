import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { url, storeId, productId } = await request.json();

        if (!url || !storeId) {
            return NextResponse.json({ success: false, error: 'URL y Store ID son requeridos' }, { status: 400 });
        }

        // 1. Simular creación de registro si no existe o usar uno nuevo
        // En producción aquí se llamaría a un scraper + Gemini Vision
        const newLanding = await prisma.landingClone.create({
            data: {
                storeId,
                productId,
                originalUrl: url,
                status: 'COMPLETED',
                assetsJson: JSON.stringify({
                    analysis: {
                        scores: {
                            mobile: Math.floor(Math.random() * 20) + 75,
                            desktop: Math.floor(Math.random() * 15) + 80,
                            cvr: (Math.random() * 2 + 2).toFixed(1) + '%'
                        },
                        criticalPoints: [
                            "Hero Section demasiado pesada (imágenes sin optimizar)",
                            "No hay testimonios visibles en el primer scroll",
                            "El copy no ataca el dolor principal detectado en el Avatar"
                        ],
                        recommendations: [
                            "Optimizar imágenes a formato WebP",
                            "Incluir una oferta con limite de tiempo (urgencia)",
                            "Añadir sección de preguntas frecuentes (FAQ)"
                        ]
                    }
                })
            }
        });

        return NextResponse.json({
            success: true,
            landingId: newLanding.id
        });

    } catch (error: any) {
        console.error('[API-ANALIZAR] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
