import { NextRequest, NextResponse } from 'next/server';
import { BulkUploadPipeline } from '@/lib/creative/bulk-upload-pipeline';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 min para lotes grandes

export async function POST(req: NextRequest) {
    const storeId   = req.headers.get('X-Store-Id');
    const formData  = await req.formData();
    const productId = formData.get('productId') as string;
    const isCompetitor = formData.get('isCompetitor') === 'true';
    const files     = formData.getAll('files') as File[];

    if (!productId || !files.length || !storeId) {
        return NextResponse.json(
            { error: 'productId, storeId y al menos un archivo son requeridos' },
            { status: 400 }
        );
    }

    // Convertir Files a Buffers
    const fileBuffers = await Promise.all(
        files.map(async (file) => ({
            buffer: Buffer.from(await file.arrayBuffer()),
            fileName: file.name,
        }))
    );

    // Procesar en lote
    const { results, summary } = await BulkUploadPipeline.processBatch({
        files: fileBuffers,
        productId,
        storeId,
        source: 'UPLOAD',
        isCompetitor,
    });

    return NextResponse.json({
        ok: true,
        summary,
        results: results.map(r => ({
            fileName:    r.fileName,
            success:     r.success,
            name:        r.nomenclatura,       // MICR-C1-V1.mp4
            concept:     r.concept ? `C${r.concept}` : null,
            conceptName: r.conceptName,
            traffic:     r.audienceType,
            awareness:   r.awarenessLevel,
            drivePath:   r.drivePath,
            assetId:     r.assetId,
            clips:       r.clips,
            error:       r.error,
        }))
    });
}
