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
 * 5. ORGANIZED    → nomenclatura IA + guardar en Drive
 * 6. DONE
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadToProduct } from '@/lib/services/drive-service';
import { invalidateProductCache } from '@/lib/services/product-index';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { ElevenLabsService } from '@/lib/services/elevenlabs-service';
import { AiRouter } from '@/lib/ai/router';
import { TaskType } from '@/lib/ai/providers/interfaces';

const execAsync = promisify(exec);

// Helper locales para nomenclatura
const productCode = (title: string) => title.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'PROD';
const buildNomenclature = (opts: { prodCode: string, conceptCode: string, funnelStage: string, type: string, version: string | number, ext: string }) => 
    `${opts.prodCode}_${opts.conceptCode}_${opts.funnelStage}_${opts.type}_V${opts.version}.${opts.ext}`;

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

import { generateVideo, transcribeAudio, addSubtitles, upscaleVideo } from '@/lib/replicate-client';

export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get('content-type') || '';
        
        // JSON Action Router
        if (contentType.includes('application/json')) {
            const body = await request.json();
            const { action } = body;
            
            if (action === 'generate_video') {
                const videoUrl = await generateVideo({
                    prompt: body.prompt,
                    mode: body.imageUrl ? 'image2video' : 'text2video',
                    imageUrl: body.imageUrl,
                    duration: body.duration || 5,
                    aspectRatio: body.aspectRatio || '9:16',
                    quality: 'pro',
                });
                return NextResponse.json({ ok: true, videoUrl });
            }
            
            if (action === 'transcribe') {
                const transcript = await transcribeAudio(body.audioUrl, body.language || 'es');
                return NextResponse.json({ ok: true, transcript });
            }
            
            if (action === 'add_subtitles') {
                const subtitledUrl = await addSubtitles(body.videoUrl, {
                    position: 'bottom',
                    fontSize: 7,
                    color: 'white',
                });
                return NextResponse.json({ ok: true, subtitledUrl });
            }
            
            if (action === 'upscale') {
                const upscaledUrl = await upscaleVideo(body.videoUrl);
                return NextResponse.json({ ok: true, upscaledUrl });
            }
            
            return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
        }

        // --- BACKWARD COMPATIBILITY: FORM DATA PIPELINE ---
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
  file: File, assetId: string, productId: string, storeId: string,
  jobId: string, hints: { conceptCode?: string | null; funnelStage?: string | null }
) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vlab-'));
  const inputPath = path.join(tmpDir, file.name);
  const strippedPath = path.join(tmpDir, 'stripped_' + file.name);
 
  try {
    // Guardar archivo temporalmente
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(inputPath, buffer);
 
    // PASO 1: Strip metadata con FFmpeg (obligatorio)
    await execAsync(
      `ffmpeg -i '${inputPath}' -map_metadata -1 -c:v copy -c:a copy '${strippedPath}' -y`
    );
    updateJob(jobId, { status: 'INGESTED', progress: 20 });
 
    // PASO 2: Transcripción con ElevenLabs Scribe v2
    const audioPath = path.join(tmpDir, 'audio.mp3');
    await execAsync(`ffmpeg -i '${strippedPath}' -vn -acodec mp3 '${audioPath}' -y`);
    const audioBuffer = await fs.readFile(audioPath);
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mp3' });
    const transcriptionResult = await ElevenLabsService.speechToText(audioBlob);
    const transcription = transcriptionResult?.text || '';
    updateJob(jobId, { status: 'TRANSCRIBED', progress: 45 });
 
    // PASO 3: Análisis con Gemini
    const analysisResult = await AiRouter.dispatch(
      storeId, TaskType.RESEARCH_DEEP,
      `Analiza este vídeo publicitario. Transcripción: ${transcription}
      Responde JSON: { "funnelStage": "...", "type": "...", "hook": "...", "hookScore": 5, "avatarMatch": "...", "angle": "...", "engagementPrediction": "...", "improvementSuggestions": "..." }`,
      { jsonSchema: true }
    );
    let analysis: any = {};
    try { analysis = JSON.parse(analysisResult.text.replace(/```json|```/g, '').trim()); } catch {}
    updateJob(jobId, { status: 'ANALYZED', progress: 65, hook: analysis.hook, funnelStage: analysis.funnelStage });
 
    // PASO 4: Scene detect y split con FFmpeg
    const clipsDir = path.join(tmpDir, 'clips');
    await fs.mkdir(clipsDir, { recursive: true });
    await execAsync(
      `ffmpeg -i '${strippedPath}' -filter:v "select='gt(scene,0.3)',showinfo" -vsync vfr '${clipsDir}/clip_%03d.mp4' -y`
    ).catch(() => {
      // Si no detecta escenas, copiar el vídeo completo como único clip
      return execAsync(`cp '${strippedPath}' '${clipsDir}/clip_001.mp4'`);
    });
    updateJob(jobId, { status: 'SPLIT', progress: 80 });
 
    // PASO 5: Subir a Drive con nomenclatura IA
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { sku: true, title: true } });
    const sku = product?.sku || 'PROD';
    const existingVersions = await (prisma as any).creativeAsset.count({
        where: { productId, conceptCode: hints.conceptCode || 'C01', type: analysis.type || 'UGC', funnelStage: analysis.funnelStage || hints.funnelStage || 'TOF' }
    });
    const generatedNomen = buildNomenclature({
      prodCode: productCode(product?.title ?? 'PRD'), conceptCode: hints.conceptCode || 'C01',
      funnelStage: analysis.funnelStage || hints.funnelStage || 'TOF',
      type: analysis.type || 'UGC', version: existingVersions, ext: 'mp4'
    });
 
    const driveFileUpload = await uploadToProduct(
      Buffer.from(await fs.readFile(strippedPath)),
      generatedNomen,
      file.type,
      productId,
      storeId,
      { conceptCode: hints.conceptCode || 'C01', funnelStage: analysis.funnelStage || hints.funnelStage || 'TOF', fileType: 'VIDEO' }
    );
 
    // Actualizar asset en BD
    await (prisma as any).creativeAsset.update({
      where: { id: assetId },
      data: {
        transcription, funnelStage: analysis.funnelStage, type: analysis.type,
        hook: analysis.hook, hookScore: analysis.hookScore, angle: analysis.angle,
        driveFileId: driveFileUpload.driveFileId, drivePath: driveFileUpload.drivePath, driveUrl: `https://drive.google.com/file/d/${driveFileUpload.driveFileId}/view`, processingStatus: 'READY', nomenclature: generatedNomen,
        metadata: JSON.stringify({ analysis, clipsCount: (await fs.readdir(clipsDir)).length })
      }
    });
 
    updateJob(jobId, { status: 'DONE', progress: 100, nomenclature: generatedNomen });
 
  } catch (err: any) {
    console.error('[VideoLab] Pipeline error:', err);
    updateJob(jobId, { status: 'ERROR', progress: 0, error: err.message });
    await (prisma as any).creativeAsset.update({
      where: { id: assetId },
      data: { processingStatus: 'ERROR' }
    });
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}
 
function updateJob(jobId: string, updates: Partial<JobStatus>) {
  const job = jobs.get(jobId);
  if (job) jobs.set(jobId, { ...job, ...updates, updatedAt: new Date().toISOString() });
}
