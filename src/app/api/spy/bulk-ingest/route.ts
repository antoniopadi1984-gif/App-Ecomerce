import { NextRequest, NextResponse } from 'next/server';
import { analyzeCompetitorVideo } from '@/lib/creative/competitor-analysis-job-v2';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
    try {
        const storeId = req.headers.get('X-Store-Id') || 'store-main';
        const formData = await req.formData();

        const productId = formData.get('productId') as string;
        const competitorName = formData.get('competitorName') as string || '';
        const adCopy = formData.get('adCopy') as string || '';
        const isOwn = formData.get('isOwn') === 'true';
        const file = formData.get('videos') as File;

        if (!productId || !file) {
            return NextResponse.json({ ok: false, error: 'productId y video requeridos' }, { status: 400 });
        }

        // Guardar archivo temporalmente
        const tmpDir = os.tmpdir();
        const tmpPath = path.join(tmpDir, `upload_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._]/g, '_')}`);
        const buffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(tmpPath, buffer);

        // Analizar en background (no bloqueamos la respuesta)
        const jobId = `job_${Date.now()}`;

        // Lanzar análisis async
        analyzeCompetitorVideo({
            videoPath: tmpPath,
            productId,
            storeId,
            competitorName,
            adCopy,
            isOwn,
        }).then(result => {
            console.log(`[Job ${jobId}] Completado: ${result.nomenclature}`);
            try { fs.unlinkSync(tmpPath); } catch {}
        }).catch(err => {
            console.error(`[Job ${jobId}] Error:`, err);
            try { fs.unlinkSync(tmpPath); } catch {}
        });

        return NextResponse.json({
            ok: true,
            jobId,
            fileName: file.name,
            message: 'Video recibido — analizando con Whisper + Gemini',
        });

    } catch (e: any) {
        console.error('[bulk-ingest] Error:', e);
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
}
