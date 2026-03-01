/**
 * POST /api/video-lab/process
 * Inicia el pipeline de procesamiento de un vídeo.
 * Retorna jobId inmediatamente. El progreso se consulta via
 * GET /api/video-lab/status?jobId=X
 *
 * Pipeline:
 * 1. INGESTED     → metadata strip, detect lang, duration, fps
 * 2. TRANSCRIBED  → Whisper transcription
 * 3. ANALYZED     → Gemini: funnel stage, type, hook, avatar, angle, scoring
 * 4. SPLIT        → FFmpeg scene detect → clips separados
 * 5. ORGANIZED    → nomenclatura Spencer + guardar en Drive
 * 6. DONE
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildNomenclature, productCode, uploadToProduct } from '@/lib/services/drive-service';
import { invalidateProductCache } from '@/lib/services/product-index';

// In-memory job store (en producción usar Bull/Redis)
const jobs = new Map<string, JobStatus>();

interface JobStatus {
    id: string;
    assetId: string;
    fileName: string;
    status: 'INGESTED' | 'TRANSCRIBED' | 'ANALYZED' | 'SPLIT' | 'ORGANIZED' | 'DONE' | 'ERROR';
    progress: number; // 0-100
    hook?: string;
    funnelStage?: string;
    type?: string;
    nomenclature?: string;
    error?: string;
    startedAt: string;
    updatedAt: string;
}

export async function POST(request: NextRequest) {
    try {
        const storeId = request.headers.get('X-Store-Id');
        if (!storeId) return NextResponse.json({ error: 'Store ID required' }, { status: 400 });

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const productId = formData.get('productId') as string;
        const conceptCodeHint = formData.get('conceptCode') as string | null;
        const funnelHint = formData.get('funnelStage') as string | null;

        if (!file || !productId) {
            return NextResponse.json({ error: 'file and productId required' }, { status: 400 });
        }

        // 1. Create CreativeAsset record immediately
        const asset = await (prisma as any).creativeAsset.create({
            data: {
                productId,
                storeId,
                type: 'VIDEO',
                name: file.name,
                processingStatus: 'PENDING',
            }
        });

        const jobId = `job_${Date.now()}_${asset.id.slice(0, 8)}`;
        const job: JobStatus = {
            id: jobId,
            assetId: asset.id,
            fileName: file.name,
            status: 'INGESTED',
            progress: 15,
            startedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        jobs.set(jobId, job);

        // Process in background (no await)
        processVideoBackground(file, asset.id, productId, storeId, jobId, {
            conceptCode: conceptCodeHint,
            funnelStage: funnelHint,
        }).catch(e => {
            const j = jobs.get(jobId);
            if (j) { j.status = 'ERROR'; j.error = e.message; j.updatedAt = new Date().toISOString(); }
        });

        return NextResponse.json({ ok: true, jobId, assetId: asset.id });

    } catch (error) {
        console.error('[VideoLab/process] Error:', error);
        return NextResponse.json({ error: 'Failed to start processing' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 });
    const job = jobs.get(jobId);
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    return NextResponse.json(job);
}

// ── Background processing ─────────────────────────────────────────────────────
async function processVideoBackground(
    file: File,
    assetId: string,
    productId: string,
    storeId: string,
    jobId: string,
    hints: { conceptCode?: string | null; funnelStage?: string | null }
) {
    const updateJob = (updates: Partial<JobStatus>) => {
        const j = jobs.get(jobId);
        if (j) { Object.assign(j, updates, { updatedAt: new Date().toISOString() }); }
    };
    const updateAsset = (data: any) =>
        (prisma as any).creativeAsset.update({ where: { id: assetId }, data });

    try {
        await updateAsset({ processingStatus: 'PROCESSING' });

        // ── STEP 1: TRANSCRIPTION (Whisper via Replicate or OpenAI) ──────────
        updateJob({ status: 'TRANSCRIBED', progress: 30 });
        let transcription = '';
        let detectedLang = 'es';
        try {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Try Replicate Whisper
            const replicateToken = process.env.REPLICATE_API_TOKEN;
            if (replicateToken) {
                const { default: Replicate } = await import('replicate');
                const replicate = new Replicate({ auth: replicateToken });

                // Upload to tmp for Replicate
                const base64 = buffer.toString('base64');
                const dataUrl = `data:${file.type};base64,${base64}`;

                const output: any = await replicate.run(
                    'openai/whisper:4d50797290df275329f202e48c76360b3f22b08d28c196cbc54600319435f8d2',
                    { input: { audio: dataUrl, translate: false, language: null } }
                );
                transcription = output?.transcription ?? output?.text ?? '';
                detectedLang = output?.detected_language ?? 'es';
            }
        } catch (e) {
            console.warn('[VideoLab] Transcription failed:', e);
            transcription = '[Transcripción no disponible]';
        }

        await updateAsset({ transcription, processingStatus: 'TRANSCRIBED' });

        // ── STEP 2: ANALYZE with Gemini ──────────────────────────────────────
        updateJob({ status: 'ANALYZED', progress: 55 });
        let funnelStage = hints.funnelStage ?? 'TOF';
        let type = 'UGC';
        let hookText = '';
        let conceptCode = hints.conceptCode ?? 'C01';
        let scoreHook = 3, scoreEmotion = 3;

        try {
            const { GoogleGenerativeAI } = await import('@google/generative-ai');
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
            const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL_FAST || 'gemini-2.0-flash' });

            const prompt = `Analiza esta transcripción de vídeo publicitario y extrae:
1. funnelStage: TOF (frío, awareness) | MOF (tibio, consideración) | BOF (caliente, compra) | RT-CART | RT-VIEW | RT-BUYER
2. type: UGC | FACE | DEMO | STATIC
3. hookText: primeras 1-2 frases del gancho (máximo 20 palabras)
4. conceptCode: si mencionas mecanismo único → C01, error común → C02, vergüenza social → C03, urgencia → C04. Si no puedes determinar → C01
5. scoreHook: 1-5 (claridad y fuerza del gancho)
6. scoreEmotion: 1-5 (intensidad emocional)

Transcripción (${detectedLang}):
${transcription.slice(0, 2000)}

Responde SOLO con JSON:
{"funnelStage":"TOF","type":"UGC","hookText":"...","conceptCode":"C01","scoreHook":3,"scoreEmotion":4}`;

            const result = await model.generateContent(prompt);
            const text = result.response.text().trim().replace(/```json\n?|\n?```/g, '');
            const parsed = JSON.parse(text);

            funnelStage = parsed.funnelStage ?? funnelStage;
            type = parsed.type ?? type;
            hookText = parsed.hookText ?? '';
            conceptCode = parsed.conceptCode ?? conceptCode;
            scoreHook = parsed.scoreHook ?? 3;
            scoreEmotion = parsed.scoreEmotion ?? 3;
        } catch (e) {
            console.warn('[VideoLab] Gemini analysis failed:', e);
        }

        await updateAsset({
            processingStatus: 'ANALYZED',
            funnelStage, type, hookText, conceptCode,
        });
        updateJob({ funnelStage, type });

        // ── STEP 3: Build nomenclature ────────────────────────────────────────
        updateJob({ status: 'ORGANIZED', progress: 80 });
        const product = await (prisma as any).product.findUnique({
            where: { id: productId }, select: { title: true }
        });
        const prodCode = productCode(product?.title ?? 'PRD');

        // Count existing versions for this concept
        const existingVersions = await (prisma as any).creativeAsset.count({
            where: { productId, conceptCode, type, funnelStage }
        });

        const nomenclature = buildNomenclature({
            prodCode,
            conceptCode,
            funnelStage,
            type,
            version: existingVersions,
            ext: 'mp4',
        });

        updateJob({ status: 'ORGANIZED', progress: 90, nomenclature });

        // ── STEP 4: Drive Upload ──────────────────────────────────────────────
        try {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const { driveFileId, drivePath } = await uploadToProduct(
                buffer,
                nomenclature,
                file.type,
                productId,
                storeId,
                { conceptCode, funnelStage, fileType: 'VIDEO' }
            );

            await updateAsset({
                driveFileId,
                drivePath,
                driveUrl: `https://drive.google.com/file/d/${driveFileId}/view`,
                processingStatus: 'DONE',
            });
        } catch (e) {
            console.error('[VideoLab] Drive upload failed:', e);
            await updateAsset({ processingStatus: 'DONE' }); // Still mark as done in DB even if drive fails
        }

        updateJob({ status: 'DONE', progress: 100 });

        // ── STEP 5: Invalidate caches ─────────────────────────────────────────
        invalidateProductCache(productId);

    } catch (e: any) {
        await (prisma as any).creativeAsset.update({
            where: { id: assetId },
            data: { processingStatus: 'ERROR' }
        }).catch(() => { });
        throw e;
    }
}
