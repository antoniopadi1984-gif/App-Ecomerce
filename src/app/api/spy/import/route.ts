import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DriveSync } from '@/lib/research/drive-sync';
import { InboxProcessor } from '@/lib/drive/inbox-processor';

// POST /api/spy/import
// Recibe assets Meta/TikTok desde extensión Chrome
// → descarga archivos (mp4, webm, jpg, gif, png)
// → sube a 00_INBOX/SPY/ en Drive
// → limpia metadata FFmpeg (strip all, normalizar H264/AAC)
// → lanza agente clasificador completo
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { assets, productoId, competitorId, source } = body;

        console.log(`[Spy Import] Recibidos ${assets?.length || 0} de ${source} para Producto: ${productoId} | Competidor: ${competitorId}`);

        if (!productoId || !assets?.length) {
            return NextResponse.json({ error: 'Producto o assets incompletos' }, { status: 400 });
        }

        // Mock: Download & Save to Drive under 00_INBOX/SPY
        // const driveSync = new DriveSync();
        // Here we'd call the real drive logic. Subiendo a Drive 00_INBOX/SPY/

        // Mock: FFmpeg stripping 
        // ...

        // Guardar metadata preliminar en Prisma como DriveAsset
        for (const asset of assets) {
            await prisma.driveAsset.create({
                data: {
                    productId: productoId,
                    driveFileId: `mock_drive_id_${Date.now()}_${Math.random()}`,
                    drivePath: '00_INBOX/SPY',
                    assetType: asset.type,
                    sourceUrl: asset.videoUrl || asset.imageUrl || '',
                    organized: true,
                    // @ts-ignore: Prisma type issue locally
                    metadata: JSON.stringify({
                        source,
                        competitorId,
                        headline: asset.headline,
                        copy: asset.copyBody,
                        startDate: asset.startDate,
                        type: asset.type
                    })
                }
            });
        }

        // Trigger InboxProcessor (Bloque 4 Agente Clasificador)
        // Ejecución en segundo plano 'fire & forget'
        setTimeout(async () => {
            try {
                const processor = new InboxProcessor();
                await processor.processProductInbox(productoId);
            } catch (err) {
                console.error('[Background InboxProcessor] Error:', err);
            }
        }, 1000);

        return NextResponse.json({ ok: true, count: assets.length });

    } catch (error: unknown) {
        console.error('[Spy Import API Error]', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
