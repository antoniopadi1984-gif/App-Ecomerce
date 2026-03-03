import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/spy/saturation-map?productoId=X
// Analiza TODOS los spy_assets del producto
// → detecta hooks repetidos entre competidores
// → detecta claims saturados
// → detecta mecanismos sobreusados
// → detecta estructuras de landing repetidas
// → devuelve mapa: ✅ Oportunidad / ⚠️ Saturado / ❌ Quemado
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const productoId = searchParams.get('productoId');

        if (!productoId) {
            return NextResponse.json({ error: 'productoId requerido' }, { status: 400 });
        }

        // Recuperar todo lo que el Agente Inbox ha clasificado (ej: metadata.hook, metadata.angulo)
        const allAssets = await prisma.driveAsset.findMany({
            where: {
                productId: productoId,
                organized: true
                // We're specifically picking up things processed by InboxAgent 
            }
        });

        // En el backend real: 
        // 1. Agrupar todo el texto, hooks, ángulos, y mandarlo a Gemini Pro.
        // 2. prompt: 'Identifica la saturación del mercado basado en esta lista...'

        // MOCK Response Data for the UI Matrix
        const saturationMap = {
            productoId,
            totalAssetsAnalizados: allAssets.length,
            hooks: [
                { hook: "Alivio instantáneo o devolución", nivel: "Quemado", score: 95 },
                { hook: "¿Cansado de despertar con dolor?", nivel: "Saturado", score: 75 },
                { hook: "El secreto japonés para...", nivel: "Oportunidad", score: 15 }
            ],
            mecanismos: [
                { nombre: "Alineación Espinal Genérica", nivel: "Quemado" },
                { nombre: "Tecnología Memory Foam 3D", nivel: "Saturado" },
                { nombre: "Fascia Release Trigger Point", nivel: "Oportunidad" }
            ],
            claims: [
                { texto: "Mejora en 3 noches", nivel: "Saturado" },
                { texto: "Validado por la universidad de Harvard", nivel: "Oportunidad" }
            ],
            recomendacionIA: "El mercado compite por el alivio rápido. La oportunidad radica en enfocarse en la prevención a largo plazo (fascia release) mediante storytelling enfocado en la pérdida laboral."
        };

        return NextResponse.json({ ok: true, data: saturationMap });

    } catch (error: unknown) {
        return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
