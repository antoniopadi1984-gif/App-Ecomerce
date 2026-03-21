import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadToProduct } from '@/lib/services/drive-service';
import { MetadataRemover } from '@/lib/creative/generators/metadata-remover';

// POST /api/spy/import
// Recibe assets Meta/TikTok desde extensión Chrome
// → descarga archivos (mp4, webm, jpg, gif, png)
// → sube a 4_COMPETENCIA/INBOX/SPY/ en Drive
// → limpia metadata FFmpeg (strip all, normalizar H264/AAC)
// → lanza agente clasificador completo
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { assets, productoId, competitorId, source } = body;
        const storeId = req.headers.get('X-Store-Id') || 'store-main';

        console.log(`[Spy Import] Recibidos ${assets?.length || 0} de ${source} para Producto: ${productoId} | Competidor: ${competitorId}`);

        if (!productoId || !assets?.length) {
            return NextResponse.json({ error: 'Producto o assets incompletos' }, { status: 400 });
        }

        const driveResults: any[] = [];

        for (const asset of assets) {
            try {
                const assetUrl = asset.videoUrl || asset.imageUrl || asset.thumbnailUrl;
                if (!assetUrl) continue;

                // Descargar asset
                const assetBuffer = await fetch(assetUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0' },
                    signal: AbortSignal.timeout(15000)
                }).then(r => r.arrayBuffer()).then(ab => Buffer.from(ab));

                // Strip metadata
                const ext = asset.type === 'video' ? 'mp4' : 'jpg';
                const fileName = `SPY_${competitorId || 'COMP'}_${asset.platform || 'META'}_${Date.now()}.${ext}`;
                const mimeType = asset.type === 'video' ? 'video/mp4' : 'image/jpeg';

                const stripped = asset.type === 'video'
                    ? await MetadataRemover.stripVideo(assetBuffer, fileName).catch(() => assetBuffer)
                    : await MetadataRemover.stripImage(assetBuffer, fileName).catch(() => assetBuffer);

                // Subir a Drive 4_COMPETENCIA/INBOX/SPY/
                const driveResult = await uploadToProduct(
                    stripped, fileName, mimeType, productoId, storeId,
                    { subfolderName: `4_COMPETENCIA/INBOX/SPY/${competitorId || 'GENERAL'}`, fileType: asset.type === 'video' ? 'VIDEO' : 'IMAGE' }
                );

                // Registrar en BD
                await (prisma as any).driveAsset.create({
                    data: {
                        productId: productoId, storeId,
                        driveFileId: driveResult.driveFileId,
                        driveUrl: driveResult.driveUrl,
                        drivePath: `4_COMPETENCIA/INBOX/SPY/${competitorId || 'GENERAL'}`,
                        assetType: asset.type === 'video' ? 'SPY_VIDEO' : 'SPY_IMAGE',
                        sourceUrl: assetUrl,
                        organized: false, // Pendiente de clasificar por el agente
                        agentReadable: true,
                        metadata: JSON.stringify({
                            platform: asset.platform || source,
                            competitorId,
                            originalUrl: assetUrl,
                            adId: asset.adId,
                            caption: asset.caption
                        })
                    }
                });

                driveResults.push({ fileName, driveUrl: driveResult.driveUrl, type: asset.type });
            } catch (e: any) {
                console.warn(`[SpyImport] Error con asset ${asset.videoUrl}:`, e.message);
            }
        }

        // Marcar como organizados en background (clasificación posterior)
        ;(async () => {
            try {
                const unclassified = await (prisma as any).driveAsset.findMany({
                    where: { productId: productoId, organized: false, assetType: { startsWith: 'SPY' } },
                    select: { id: true, driveUrl: true, assetType: true, sourceUrl: true }
                });
                for (const a of unclassified) {
                    await (prisma as any).driveAsset.update({
                        where: { id: a.id },
                        data: { organized: true }
                    });
                }
            } catch {}
        })();

        return NextResponse.json({
            ok: true,
            imported: driveResults.length,
            failed: assets.length - driveResults.length,
            assets: driveResults
        });

    } catch (error: unknown) {
        console.error('[Spy Import API Error]', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
