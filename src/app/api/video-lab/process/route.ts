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
 
    // PASO 3: Análisis con Gemini (Deep Marketer)
    // Generamos un preview ligero para que la IA lo vea sin explotar la memoria
    const previewPath = path.join(tmpDir, 'gemini_preview.mp4');
    await execAsync(`ffmpeg -i '${strippedPath}' -s 480x270 -r 5 -c:v libx264 -crf 30 -an '${previewPath}' -y`);
    const videoPreviewBase64 = (await fs.readFile(previewPath)).toString('base64');

    const analysisResult = await AiRouter.dispatch(
      storeId, TaskType.PERFORMANCE_ADS, 
      `Eres un Marketer Senior de Respuesta Directa. Analiza este video y su transcripción "${transcription}".
      Responde JSON: 
      { 
        "conceptSuggestion": "NOMBRE_DEL_CONCEPTO",
        "funnelStage": "TOFU|MOFU|BOFU|RETARGETING", 
        "type": "UGC|REVIEW|COMERCIAL", 
        "hookScore": 1-10, 
        "hook": "Análisis del gancho", 
        "angle": "Ángulo psicológico (ej: Lógica, Miedo, Status...)",
        "avatarMatch": "Perfil psicográfico",
        "clips": [{"name": "HOOK", "start": 0, "end": 3}, ...],
        "improvementSuggestions": "Análisis marketer profundo..." 
      }`,
      { 
        jsonSchema: true,
        video: `data:video/mp4;base64,${videoPreviewBase64}`,
        videoMimeType: 'video/mp4'
      }
    );
    let analysis: any = {};
    try { analysis = JSON.parse(analysisResult.text.replace(/```json|```/g, '').trim()); } catch {}
    
    const conceptCode = hints.conceptCode || analysis.conceptSuggestion || 'CREATIVO_IA';
    const funnelStage = analysis.funnelStage || hints.funnelStage || 'TOFU';

    updateJob(jobId, { status: 'ANALYZED', progress: 65, hook: analysis.hook, funnelStage });
 
    // PASO 4: Disección de clips (Scenedetect impulsado por IA + FFmpeg)
    const clipsDir = path.join(tmpDir, 'clips');
    await fs.mkdir(clipsDir, { recursive: true });
    
    if (analysis.clips && analysis.clips.length > 0) {
        for (let i = 0; i < analysis.clips.length; i++) {
            const clip = analysis.clips[i];
            const name = clip.name.toUpperCase().replace(/\s+/g, '_');
            const duration = clip.end - clip.start;
            if (duration > 0.5) {
                await execAsync(
                    `ffmpeg -i '${strippedPath}' -ss ${clip.start} -t ${duration} -c:v libx264 -crf 23 -c:a aac '${clipsDir}/CLIP_${i+1}_${name}.mp4' -y`
                );
            }
        }
    } else {
        // Fallback: Segmentos de 10s si la IA no dió timestamps
        await execAsync(
            `ffmpeg -i '${strippedPath}' -f segment -segment_time 10 -c copy '${clipsDir}/SCENE_%02d.mp4' -y`
        );
    }
    updateJob(jobId, { status: 'SPLIT', progress: 80 });
 
    // PASO 5: Subir a Drive con nomenclatura IA y organización granular
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { sku: true, title: true } });
    
    // Simplificar versión: V1, V2... (sin ceros)
    const existingVersions = await (prisma as any).creativeAsset.count({
        where: { productId, conceptCode }
    });
    const versionNum = existingVersions + 1;
    const generatedNomen = `${productCode(product?.title ?? 'PRD')}_V${versionNum}_${conceptCode}.mp4`;
 
    // 5.1 Subir Video Principal
    const mainVideoUpload = await uploadToProduct(
      Buffer.from(await fs.readFile(strippedPath)),
      generatedNomen,
      file.type,
      productId,
      storeId,
      { 
        conceptCode, 
        funnelStage, 
        angle: analysis.angle,
        fileType: 'VIDEO', 
        version: versionNum 
      }
    );

    // 5.2 Subir Documento de Análisis (Google Doc)
    const analysisDocContent = `
ANÁLISIS ESTRATÉGICO IA PRO
===========================
Creativo: ${generatedNomen}
Concepto: ${conceptCode}
Fase: ${funnelStage} | Tipo: ${analysis.type}

1. EVALUACIÓN DEL GANCHO (Score: ${analysis.hookScore}/10):
${analysis.hook}

2. ÁNGULO Y AVATAR:
- Ángulo: ${analysis.angle}
- Avatar: ${analysis.avatarMatch}

3. ESTRUCTURA DE DISECCIONES (CLIPS):
${(analysis.clips || []).map((c: any) => `- [${c.start}s - ${c.end}s]: ${c.name}`).join('\n')}

4. ANÁLISIS ESTRATÉGICO Y MEJORAS:
${analysis.improvementSuggestions}

---------------------------------------------------
Generado por el Agente Director Creativo IA Pro
    `.trim();

    await (import('@/lib/services/drive-service')).then(m => 
        m.saveAnalysisDoc(productId, storeId, mainVideoUpload.parentFolderId, `ANALISIS_${generatedNomen.replace('.mp4', '')}`, analysisDocContent)
    );

    // 5.3 Subir Clips detectados (Disecciones)
    const clipsFiles = (await fs.readdir(clipsDir)).filter(f => f.endsWith('.mp4'));
    for (const clipFile of clipsFiles) {
        const clipBuffer = await fs.readFile(path.join(clipsDir, clipFile));
        await uploadToProduct(
            clipBuffer,
            clipFile, 
            'video/mp4',
            productId,
            storeId,
            { 
              conceptCode, 
              funnelStage, 
              angle: analysis.angle,
              fileType: 'VIDEO', 
              version: versionNum,
              subfolderName: 'CLIPS'
            }
        );
    }
 
    // Actualizar asset en BD
    await (prisma as any).creativeAsset.update({
      where: { id: assetId },
      data: {
        transcription, conceptCode, funnelStage, type: analysis.type, versionNumber: versionNum,
        hook: analysis.hook, hookScore: analysis.hookScore, angle: analysis.angle,
        driveFileId: mainVideoUpload.driveFileId, drivePath: mainVideoUpload.drivePath, driveUrl: `https://drive.google.com/file/d/${mainVideoUpload.driveFileId}/view`, processingStatus: 'READY', nomenclature: generatedNomen,
        metadata: JSON.stringify({ analysis, clipsCount: clipsFiles.length })
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
