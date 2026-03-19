import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
    const storeId  = req.headers.get('X-Store-Id');
    const formData = await req.formData();
    const productId    = formData.get('productId') as string;
    const isCompetitor = formData.get('isCompetitor') === 'true';
    const files        = formData.getAll('files') as File[];

    if (!productId || !files.length || !storeId) {
        return NextResponse.json(
            { error: 'productId, storeId y al menos un archivo son requeridos' },
            { status: 400 }
        );
    }

    const queued: any[] = [];

    for (const file of files) {
        const isVideo = file.type.startsWith('video/');
        const isImage = file.type.startsWith('image/');
        if (!isVideo && !isImage) continue;

        const asset = await (prisma as any).creativeAsset.create({
            data: {
                productId,
                storeId,
                type: isVideo ? 'VIDEO' : 'IMAGE',
                name: file.name,
                processingStatus: 'PENDING',
                tagsJson: JSON.stringify({
                    originalName: file.name,
                    fileSize: file.size,
                    isCompetitor
                })
            }
        });

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = file.name;
        const assetId = asset.id;

        ;(async () => {
            try {
                await (prisma as any).creativeAsset.update({
                    where: { id: assetId },
                    data: { processingStatus: 'PROCESSING' }
                });

                if (isVideo) {
                    const fd = new FormData();
                    const blob = new Blob([buffer], { type: file.type });
                    fd.append('video', blob, fileName);
                    fd.append('productId', productId);
                    fd.append('assetId', assetId);

                    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
                    await fetch(`${appUrl}/api/video-lab/process`, {
                        method: 'POST',
                        headers: { 'X-Store-Id': storeId },
                        body: fd
                    });
                } else {
                    const { BulkUploadPipeline } = await import('@/lib/creative/bulk-upload-pipeline');
                    await BulkUploadPipeline.processImage({
                        buffer, fileName, productId, storeId, isCompetitor
                    });
                    await (prisma as any).creativeAsset.update({
                        where: { id: assetId },
                        data: { processingStatus: 'DONE' }
                    });
                }
            } catch (err: any) {
                console.error(`[BulkUpload] Error procesando ${fileName}:`, err.message);
                await (prisma as any).creativeAsset.update({
                    where: { id: assetId },
                    data: { processingStatus: 'ERROR' }
                }).catch(() => {});
            }
        })();

        queued.push({ assetId, fileName: file.name, type: isVideo ? 'VIDEO' : 'IMAGE', status: 'PENDING' });
    }

    return NextResponse.json({
        ok: true,
        queued: queued.length,
        jobs: queued,
        message: `${queued.length} archivos en cola — la IA los clasifica automáticamente`
    });
}
