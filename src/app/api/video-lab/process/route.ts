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
import crypto from 'crypto';
import { uploadToProduct, saveAnalysisDoc } from '@/lib/services/drive-service';
import { invalidateProductCache } from '@/lib/services/product-index';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { ElevenLabsService } from '@/lib/services/elevenlabs-service';
import { AiRouter } from '@/lib/ai/router';
import { TaskType } from '@/lib/ai/providers/interfaces';
import { generateSRT } from '@/lib/video/subtitle-utils';

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
    
    let transcription = '';
    let words: any[] = [];
    try {
        const transcriptionResult = await ElevenLabsService.speechToText(audioBlob, { storeId });
        transcription = transcriptionResult?.text || '';
        words = transcriptionResult?.words || [];
    } catch (sttError: any) {
        console.warn(`[VideoLab] Transcription failed (continuing without it): ${sttError.message}`);
    }
    
    updateJob(jobId, { status: 'TRANSCRIBED', progress: 45 });
 
    // PASO 3: Análisis con Gemini (Deep Marketer)
    // Generamos un preview ligero para que la IA lo vea sin explotar la memoria
    const previewPath = path.join(tmpDir, 'gemini_preview.mp4');
    await execAsync(`ffmpeg -i '${strippedPath}' -s 480x270 -r 5 -c:v libx264 -crf 30 -an '${previewPath}' -y`);
    const videoPreviewBase64 = (await fs.readFile(previewPath)).toString('base64');

    const product = await prisma.product.findUnique({ where: { id: productId }, select: { sku: true, title: true } });

    const analysisResult = await AiRouter.dispatch(
      storeId, TaskType.PERFORMANCE_ADS, 
      `ACTÚA COMO UN DIRECTOR CREATIVO DE PERFORMANCE (CMO).
      Analiza el video y la transcripción: "${transcription}". 
      PRODUCTO: "${product?.title || 'GENERAL'}" (SKU: ${product?.sku || 'N/A'})
      ORIGINAL: "${file.name}"
      
      OBJETIVO: Identificar la estructura de venta y diseccionar el video en hooks, cuerpo y CTA.
      
      TAREA:
      1. CONCEPT: Debe ser descriptivo (Ej: "DEMOSTRACION_RESISTENCIA", "UNBOXING_ESTILO_VIDA"). NO USAR "CREATIVO_IA".
      2. STAGE: Clasifica en TOFU (Frío), MOFU (Media), BOFU (Venta), RETARGETING.
      3. ANGLE: Identifica el disparador psicológico (FOMO, STATUS, LOGICA, PLACER, MIEDO).
      4. CLIPS: Identifica exactamente los tiempos de:
         - HOOK: Los primeros 1-3 segundos impactantes.
         - BODY: Argumentos de venta o beneficios.
         - CTA: Llamada a la acción final.
      
      FORMATO JSON:
      { 
        "conceptSuggestion": "NOMBRE_DESC_CONCEPTO",
        "funnelStage": "TOFU|MOFU|BOFU|RETARGETING", 
        "angle": "NOMBRE_DEL_ANGULO",
        "type": "UGC|REVIEW|DTC_AD", 
        "hookScore": 8,
        "hook": "Análisis experto del gancho...",
        "avatarMatch": "Público ideal...",
        "improvementSuggestions": "Consejos tácticos...",
        "clips": [ 
           { "start": 0, "end": 3, "name": "HOOK_INTERRUCION" },
           { "start": 3, "end": 12, "name": "BODY_PROBLEM_SOLUTION" },
           { "start": 12, "end": 15, "name": "CTA_OFERTA" }
        ]
      }`,
      { 
        jsonSchema: true,
        video: `data:video/mp4;base64,${videoPreviewBase64}`,
        videoMimeType: 'video/mp4'
      }
    );
    let analysis: any = {};
    try { analysis = JSON.parse(analysisResult.text.replace(/```json|```/g, '').trim()); } catch {}
    
    const conceptCode = hints.conceptCode || analysis.conceptSuggestion || file.name.split('.')[0].toUpperCase().replace(/[^A-Z0-9]/g, '_');
    const funnelStage = analysis.funnelStage || hints.funnelStage || 'TOFU';
    const psychologyAngle = analysis.angle || 'GENERAL';

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
 
    // Standardized Nomenclature: [SKU]_V[VERSION]_[CONCEPT]_[STAGE]_[ANGLE].mp4
    const existingVersions = await (prisma as any).creativeAsset.count({
        where: { productId, conceptCode }
    });
    const versionNum = existingVersions + 1;
    const sku = product?.sku || 'PRD';
    const psychologyAngleClean = psychologyAngle.toUpperCase().replace(/\s+/g, '_');
    const generatedNomen = `${sku}_V${versionNum}_${conceptCode}_${funnelStage}_${psychologyAngleClean}.mp4`.toUpperCase();
 
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
        angle: psychologyAngle,
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
Ángulo: ${analysis.angle}

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

    await saveAnalysisDoc(productId, storeId, mainVideoUpload.parentFolderId, `ANALISIS_${generatedNomen.replace('.mp4', '')}`, analysisDocContent);

    // 5.3 Subir Clips detectados (Disecciones) y Guardar en DB
    const clipsFiles = (await fs.readdir(clipsDir)).filter(f => f.endsWith('.mp4'));
    const uploadedClips = [];
    for (let i = 0; i < clipsFiles.length; i++) {
        const clipFile = clipsFiles[i];
        const clipBuffer = await fs.readFile(path.join(clipsDir, clipFile));
        const clipNameTag = clipFile.replace('.mp4', '').split('_').slice(2).join('_');
        const clipNomen = `${sku}_V${versionNum}_${conceptCode}_${clipNameTag}.mp4`.toUpperCase();
        
        const clipUpload = await uploadToProduct(
            clipBuffer,
            clipNomen, 
            'video/mp4',
            productId,
            storeId,
            { 
              conceptCode, 
              funnelStage, 
              angle: psychologyAngle,
              fileType: 'VIDEO', 
              version: versionNum,
              subfolderName: 'CLIPS'
            }
        );

        // CREAR ASSET EN DB PARA EL CLIP (para que aparezca en la biblioteca)
        await (prisma as any).creativeAsset.create({
            data: {
                id: crypto.randomUUID(),
                storeId,
                productId,
                name: clipNomen,
                conceptCode,
                funnelStage: funnelStage,
                angulo: psychologyAngle, // Mantenemos angulo como se llame en DB
                nomenclatura: clipNomen,
                driveFileId: clipUpload.driveFileId,
                driveUrl: clipUpload.driveUrl,
                thumbnailUrl: clipUpload.thumbnailUrl,
                type: 'VIDEO_CLIP',
                processingStatus: 'DONE',
                versionNumber: versionNum
            }
        });

        uploadedClips.push(clipUpload.driveFileId);
    }
 
    // 5.4 Subir Subtítulos (SRT) si hay palabras
    let srtUrl = '';
    if (words.length > 0) {
        const srtContent = generateSRT(words.map(w => ({ text: w.text, start: w.start, end: w.end })));
        const srtNomen = generatedNomen.replace('.mp4', '.srt');
        const srtUpload = await uploadToProduct(
            Buffer.from(srtContent),
            srtNomen,
            'text/plain',
            productId,
            storeId,
            { 
              conceptCode, 
              funnelStage, 
              angle: psychologyAngle,
              fileType: 'DOCUMENT', 
              version: versionNum 
            }
        );
        srtUrl = `https://drive.google.com/file/d/${srtUpload.driveFileId}/view`;
    }

    // Actualizar asset en BD con campos correctos del schema
    await (prisma as any).creativeAsset.update({
      where: { id: assetId },
      data: {
        transcription, 
        conceptCode, 
        funnelStage, 
        type: analysis.type, 
        versionNumber: versionNum,
        hookText: analysis.hook, 
        angulo: analysis.angle,
        driveFileId: mainVideoUpload.driveFileId, 
        drivePath: mainVideoUpload.drivePath, 
        driveUrl: `https://drive.google.com/file/d/${mainVideoUpload.driveFileId}/view`, 
        thumbnailUrl: mainVideoUpload.thumbnailUrl,
        processingStatus: 'DONE', 
        nomenclatura: generatedNomen,
        clipsJson: JSON.stringify(uploadedClips),
        scriptEs: transcription, // Guardamos la transcripción original aquí también
        tagsJson: JSON.stringify({ 
            hookScore: analysis.hookScore, 
            avatar: analysis.avatarMatch, 
            suggestions: analysis.improvementSuggestions,
            srtUrl,
            words // Store for precise bulk subtitle generation later
        })
      }
    });
 
    updateJob(jobId, { status: 'DONE', progress: 100, nomenclature: generatedNomen });
 
  } catch (err: any) {
    console.error('[VideoLab] Pipeline error:', err);
    // Emergency log to file
    try {
      await fs.appendFile('/tmp/vlab_error.log', `[${new Date().toISOString()}] Asset ${assetId}: ${err.message}\n${err.stack}\n`);
    } catch (logErr) {}
    
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
