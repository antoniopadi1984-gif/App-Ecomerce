import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadToInbox } from '@/lib/services/drive-service';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
    const storeId = req.headers.get('X-Store-Id');
    const formData = await req.formData();
    const productId = formData.get('productId') as string;
    const competitorName = (formData.get('competitorName') as string) || 'COMPETIDOR';
    const files = formData.getAll('videos') as File[];

    if (!productId || !files.length) {
        return NextResponse.json({ error: 'productId y al menos un vídeo requeridos' }, { status: 400 });
    }

    const jobs: any[] = [];

    // Procesar cada vídeo en paralelo (fire & forget)
    for (const file of files) {
        // 1. Crear registro en BD inmediatamente
        const asset = await (prisma as any).creativeAsset.create({
            data: {
                productId,
                storeId: storeId || '',
                type: 'VIDEO',
                name: file.name,
                processingStatus: 'INGESTING',
                conceptCode: `SPY_${competitorName.toUpperCase().replace(/\s+/g, '_')}`,
                funnelStage: 'UNKNOWN',
                tagsJson: JSON.stringify({ 
                    source: 'COMPETITOR', 
                    competitorName, 
                    originalName: file.name,
                    fileSize: file.size 
                })
            }
        });

        // 2. Lanzar pipeline en background
        (async () => {
            try {
                // Llamar al proceso existente de video-lab
                const pipelineForm = new FormData();
                pipelineForm.append('video', file);
                pipelineForm.append('productId', productId);
                pipelineForm.append('assetId', asset.id);
                pipelineForm.append('conceptCode', `SPY_${competitorName.toUpperCase().replace(/\s+/g, '_')}`);
                pipelineForm.append('competitorSource', 'true');

                await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/video-lab/process`, {
                    method: 'POST',
                    headers: { 'X-Store-Id': storeId || '' },
                    body: pipelineForm
                });
            } catch (e) {
                console.error(`[BulkIngest] Error procesando ${file.name}:`, e);
                await (prisma as any).creativeAsset.update({
                    where: { id: asset.id },
                    data: { processingStatus: 'ERROR' }
                });
            }
        })();

        jobs.push({ assetId: asset.id, fileName: file.name, status: 'INGESTING' });
    }

    return NextResponse.json({ 
        ok: true, 
        totalQueued: files.length,
        jobs,
        message: `${files.length} vídeos en cola de procesamiento` 
    });
}
