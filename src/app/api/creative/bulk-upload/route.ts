import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
    const storeId   = req.headers.get('X-Store-Id');
    const formData  = await req.formData();
    const productId = formData.get('productId') as string;
    const files     = formData.getAll('files') as File[];

    if (!productId || !files.length) {
        return NextResponse.json({ error: 'productId y archivos requeridos' }, { status: 400 });
    }

    const queued: any[] = [];

    for (const file of files) {
        const isVideo = file.type.startsWith('video/');
        const isImage = file.type.startsWith('image/');
        if (!isVideo && !isImage) continue;

        // Crear registro inmediato
        const asset = await (prisma as any).creativeAsset.create({
            data: {
                productId,
                storeId: storeId || '',
                type: isVideo ? 'VIDEO' : 'IMAGE',
                name: file.name,
                processingStatus: 'INGESTING',
                metadata: JSON.stringify({ originalName: file.name, fileSize: file.size })
            }
        });

        // Lanzar pipeline en background
        const pipelineForm = new FormData();
        pipelineForm.append(isVideo ? 'video' : 'image', file);
        pipelineForm.append('productId', productId);
        pipelineForm.append('assetId', asset.id);

        const endpoint = isVideo ? '/api/video-lab/process' : '/api/creative/generate-image';

        fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}${endpoint}`, {
            method: 'POST',
            headers: { 'X-Store-Id': storeId || '' },
            body: pipelineForm
        }).catch(() => {});

        queued.push({ assetId: asset.id, fileName: file.name, type: isVideo ? 'VIDEO' : 'IMAGE' });
    }

    return NextResponse.json({
        ok: true,
        queued: queued.length,
        jobs: queued,
        message: `${queued.length} archivos en procesamiento — la IA los clasificará automáticamente`
    });
}
