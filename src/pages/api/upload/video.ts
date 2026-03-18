import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import * as fs from 'fs';
import path from 'path';
import os from 'os';

export const config = {
    api: {
        bodyParser: false,
        sizeLimit: '500mb',
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end();

    const form = formidable({
        maxFileSize: 500 * 1024 * 1024, // 500MB
        uploadDir: os.tmpdir(),
        keepExtensions: true,
    });

    form.parse(req, async (err, fields, files) => {
        if (err) return res.status(500).json({ ok: false, error: err.message });

        const file = Array.isArray(files.video) ? files.video[0] : files.video;
        const productId = Array.isArray(fields.productId) ? fields.productId[0] : fields.productId;
        const storeId = Array.isArray(fields.storeId) ? fields.storeId[0] : fields.storeId || 'store-main';
        const competitorName = Array.isArray(fields.competitorName) ? fields.competitorName[0] : fields.competitorName || '';
        const isOwn = fields.isOwn === 'true' || fields.isOwn?.[0] === 'true';

        if (!file || !productId) {
            return res.status(400).json({ ok: false, error: 'video y productId requeridos' });
        }

        // Importar y lanzar análisis en background
        const { analyzeCompetitorVideo } = await import('@/lib/creative/competitor-analysis-job-v2');

        const jobId = `job_${Date.now()}`;

        analyzeCompetitorVideo({
            videoPath: file.filepath,
            productId,
            storeId,
            competitorName,
            isOwn,
        }).then(result => {
            console.log(`[Job ${jobId}] ✅ ${result.nomenclature}`);
            try { fs.unlinkSync(file.filepath); } catch {}
        }).catch((err: any) => {
            console.error(`[Job ${jobId}] ❌`, err.message);
            try { fs.unlinkSync(file.filepath); } catch {}
        });

        res.json({ ok: true, jobId, fileName: file.originalFilename, message: 'Analizando con Whisper + Gemini...' });
    });
}
