import { NextRequest, NextResponse } from 'next/server';
import { analyzeCompetitorVideo } from '@/lib/creative/competitor-analysis-job-v2';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const productId = url.searchParams.get('productId') || '';
        const storeId = url.searchParams.get('storeId') || 'store-main';
        const competitorName = url.searchParams.get('competitorName') || '';
        const isOwn = url.searchParams.get('isOwn') === 'true';
        const fileName = url.searchParams.get('fileName') || `video_${Date.now()}.mp4`;

        if (!productId) return NextResponse.json({ ok: false, error: 'productId requerido' }, { status: 400 });

        const tmpPath = path.join(os.tmpdir(), `upload_${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._]/g, '_')}`);
        const writeStream = fs.createWriteStream(tmpPath);
        const reader = req.body?.getReader();
        if (!reader) return NextResponse.json({ ok: false, error: 'Sin body' }, { status: 400 });

        await new Promise<void>((resolve, reject) => {
            const pump = async () => {
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) { writeStream.end(); break; }
                        writeStream.write(value);
                    }
                    resolve();
                } catch (e) { reject(e); }
            };
            writeStream.on('error', reject);
            pump();
        });

        const jobId = `job_${Date.now()}`;
        analyzeCompetitorVideo({ videoPath: tmpPath, productId, storeId, competitorName, isOwn })
            .then(r => { console.log(`[Job ${jobId}] ✅ ${r.nomenclature}`); try { fs.unlinkSync(tmpPath); } catch {} })
            .catch((e: any) => { console.error(`[Job ${jobId}] ❌`, e.message); try { fs.unlinkSync(tmpPath); } catch {} });

        return NextResponse.json({ ok: true, jobId, fileName, message: 'Analizando con Whisper + Gemini...' });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
}
