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
import { DEFAULT_AGENT_PROMPTS } from '@/lib/ai/defaults/agent-prompts';

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
                    mode: body.imageUrl ? 'image2video' : 'standard',
                    imageUrl: body.imageUrl,
                    duration: body.duration || 5,
                    aspectRatio: body.aspectRatio || '9:16',
                    quality: 'premium',
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
        const file = formData.get('video') as File | null; // Cambiado de 'file' a 'video' para mayor claridad
        const productId = formData.get('productId') as string;
        const assetIdHint = formData.get('assetId') as string | null;
        const conceptCodeHint = formData.get('conceptCode') as string | null;
        const funnelHint = formData.get('funnelStage') as string | null;
        const competitorSource = formData.get('competitorSource') === 'true';

        if (!file || !productId) {
            return NextResponse.json({ error: 'file and productId required' }, { status: 400 });
        }

        let asset;
        if (assetIdHint) {
            asset = await (prisma as any).creativeAsset.findUnique({ where: { id: assetIdHint } });
        }

        if (!asset) {
            asset = await (prisma as any).creativeAsset.create({
                data: {
                    productId,
                    storeId,
                    type: 'VIDEO',
                    name: file.name,
                    processingStatus: 'PENDING',
                }
            });
        }

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
            competitorSource
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
  jobId: string, hints: { conceptCode?: string | null; funnelStage?: string | null; competitorSource?: boolean }
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
    // Extraer audio — si el vídeo no tiene audio, continuar sin transcripción
    let hasAudio = true;
    try {
        let hasAudio = true;
    try {
        let hasAudio = true;
    try {
        await execAsync(`ffmpeg -i '${strippedPath}' -vn -acodec mp3 '${audioPath}' -y`);
    } catch (audioErr: any) {
        if (audioErr.message?.includes('does not contain any stream') ||
            audioErr.message?.includes('Invalid argument')) {
            console.warn('[VideoLab] Vídeo sin audio — continuando sin transcripción');
            hasAudio = false;
        } else {
            throw audioErr;
        }
    }
    } catch (audioErr: any) {
        if (audioErr.message?.includes('does not contain any stream') ||
            audioErr.message?.includes('Invalid argument')) {
            console.warn('[VideoLab] Vídeo sin audio — continuando sin transcripción');
            hasAudio = false;
        } else {
            throw audioErr;
        }
    }
    } catch (audioErr: any) {
        if (audioErr.message?.includes('does not contain any stream') || 
            audioErr.message?.includes('Invalid argument')) {
            console.warn('[VideoLab] Vídeo sin audio — continuando sin transcripción');
            hasAudio = false;
        } else {
            throw audioErr;
        }
    }
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
 
    // PASO 3: Análisis con VIDEO_INTELLIGENCE agent
    const product = await (prisma as any).product.findUnique({
        where: { id: productId },
        select: { sku: true, title: true }
    });

    // Research del producto para enriquecer el análisis
    let researchContext = '';
    try {
        const researchSteps = await (prisma as any).researchStep.findMany({
            where: { productId },
            select: { stepKey: true, outputText: true },
            orderBy: { stepKey: 'asc' }
        });
        const p1 = researchSteps.find((s: any) => s.stepKey === 'P1');
        const p2 = researchSteps.find((s: any) => s.stepKey === 'P2');
        const p4 = researchSteps.find((s: any) => s.stepKey === 'P4');
        const p5 = researchSteps.find((s: any) => s.stepKey === 'P5');
        if (p1) researchContext += `\n\nRESEARCH P1 — DESEOS DEL MERCADO:\n${p1.outputText?.slice(0, 2000)}`;
        if (p2) researchContext += `\n\nRESEARCH P2 — AVATARES:\n${p2.outputText?.slice(0, 1500)}`;
        if (p4) researchContext += `\n\nRESEARCH P4 — ÁNGULOS VALIDADOS:\n${p4.outputText?.slice(0, 1000)}`;
        if (p5) researchContext += `\n\nRESEARCH P5 — HOOKS VALIDADOS:\n${p5.outputText?.slice(0, 800)}`;
    } catch (e) {
        console.warn('[VideoLab] Research no disponible:', e);
    }

    const analysisPrompt = `Analiza el siguiente vídeo publicitario.

PRODUCTO: "${product?.title}"
SKU: "${product?.sku || 'PROD'}"

TRANSCRIPCIÓN:
${transcription || 'Sin transcripción disponible'}
${researchContext}

RESPONDE ÚNICAMENTE CON EL SIGUIENTE JSON, SIN TEXTO ADICIONAL, SIN MARKDOWN, SIN EXPLICACIONES.
EL JSON DEBE EMPEZAR CON { Y TERMINAR CON }.
USA EXACTAMENTE ESTAS CLAVES EN EL NIVEL RAÍZ:

{
  "concept": "C1",
  "conceptName": "PROBLEMA",
  "traffic": "FRIO",
  "awareness": 2,
  "awarenessName": "2_PROBLEM_AWARE",
  "framework": "PAS",
  "drivePath": "C1_PROBLEMA/FRIO/2_PROBLEM_AWARE",
  "hookScore": 8,
  "hookType": "PROBLEMA_DIRECTO",
  "angle": "angulo de venta detectado",
  "avatar": "descripcion del avatar",
  "emotionPillar": "emocion dominante",
  "primaryDesire": "deseo principal",
  "lifeForce": "LF3",
  "sophistication": 3,
  "productionType": "UGC",
  "clips": [
    {"name": "HOOK", "start": 0, "end": 4, "effectiveness": 8, "notes": "evaluacion"},
    {"name": "PROBLEMA", "start": 4, "end": 15, "effectiveness": 7, "notes": "evaluacion"},
    {"name": "AGITACION", "start": 15, "end": 26, "effectiveness": 6, "notes": "evaluacion"},
    {"name": "SOLUCION", "start": 26, "end": 43, "effectiveness": 7, "notes": "evaluacion"},
    {"name": "CTA", "start": 43, "end": 58, "effectiveness": 8, "notes": "evaluacion"}
  ],
  "overallScore": 7,
  "whyItWorks": "razones especificas",
  "whyItFails": "puntos de mejora",
  "improvements": [
    {"priority": "ALTA", "change": "cambio", "impact": "impacto", "how": "como"}
  ],
  "hookVariants": [
    {"type": "DATO_SHOCK", "text": "hook alternativo especifico para este producto"}
  ],
  "metaCopy": {
    "headline": "headline maximo 40 caracteres",
    "primaryText": "copy maximo 125 caracteres",
    "cta": "Comprar ahora"
  },
  "extractedStructure": "guion resumido del video"
}

Sustituye los valores de ejemplo por el análisis real del vídeo.
concept debe ser uno de: C1, C2, C3, C4, C5, C6, C7, C8, C9
traffic debe ser uno de: FRIO, TEMPLADO, CALIENTE, RETARGETING
framework debe ser uno de: PAS, AIDA, VSL, UGC, ANTES_DESPUES, TESTIMONIAL, EDUCATIVO, DEMOSTRACION, HOOK_PURO
Los clips DEBEN seguir la estructura del framework detectado.`;

    // Cargar system prompt del agente VIDEO_INTELLIGENCE desde BD
    let videoIntelligencePrompt: string | undefined;
    try {
        const agentProfile = await (prisma as any).agentProfile.findFirst({
            where: { role: 'video-intelligence', storeId },
            select: { systemPrompt: true }
        });
        if (agentProfile?.systemPrompt) {
            videoIntelligencePrompt = agentProfile.systemPrompt;
            console.log('[VideoLab] ✅ System prompt cargado desde BD para video-intelligence');
        }
    } catch (e) {
        console.warn('[VideoLab] No se pudo cargar system prompt desde BD, usando default');
    }

    const analysisResult = await AiRouter.dispatch(storeId, TaskType.CREATIVE_FORENSIC, analysisPrompt, { 
        jsonSchema: true,
        systemPromptOverride: videoIntelligencePrompt
    });

    let analysis: any = {
        concept: 'C1',
        conceptName: 'PROBLEMA',
        traffic: 'FRIO',
        awareness: 2,
        awarenessName: '2_PROBLEM_AWARE',
        drivePath: 'C1_PROBLEMA/FRIO/2_PROBLEM_AWARE',
        hookScore: 5,
        hookType: 'PROBLEMA_DIRECTO',
        framework: 'PAS',
        angle: 'GENERAL',
        avatar: 'No detectado',
        emotionPillar: 'curiosidad',
        clips: [],
        improvements: 'Análisis no disponible',
        replicableTemplate: '',
        hookVariants: [],
        variantsRecommended: [],
        metaCopy: { headline: '', primaryText: '', cta: '' }
    };

    try {
        let raw = analysisResult.text || '';
        // Limpiar markdown
        raw = raw.replace(/```json\s*/g, '').replace(/```/g, '').trim();
        // Extraer solo el JSON — buscar el primer { hasta el último }
        const firstBrace = raw.indexOf('{');
        const lastBrace = raw.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            raw = raw.slice(firstBrace, lastBrace + 1);
        }
        let parsed = JSON.parse(raw);
        // Gemini a veces envuelve el JSON en una clave raíz — extraer el objeto real
        const rootKeys = Object.keys(parsed);
        if (rootKeys.length === 1 && typeof parsed[rootKeys[0]] === 'object') {
            console.log('[VideoLab] JSON envuelto detectado — extrayendo de clave:', rootKeys[0]);
            parsed = parsed[rootKeys[0]];
        }
        analysis = { ...analysis, ...parsed };
        console.log('[VideoLab] ✅ Análisis parseado — concept:', parsed.concept, '| framework:', parsed.framework, '| traffic:', parsed.traffic);
    } catch (e) {
        console.warn('[VideoLab] JSON parse failed, usando defaults:', e);
        console.warn('[VideoLab] Raw response preview:', analysisResult.text?.slice(0, 300));
    }
    
    const conceptCode = hints.conceptCode || analysis.concept || file.name.split('.')[0].toUpperCase().replace(/[^A-Z0-9]/g, '_');
    const funnelStage = analysis.traffic || hints.funnelStage || 'COLD';
    const psychologyAngle = analysis.angle || 'GENERAL';

    updateJob(jobId, { status: 'ANALYZED', progress: 65, hook: analysis.hook, funnelStage });
 
    // PASO 4: Nomenclatura y versión
    const sku = product?.sku || productCode(product?.title ?? 'PRD');
    const existingVersions = await (prisma as any).creativeAsset.count({
        where: { productId, conceptCode }
    });
    const version = existingVersions + 1;
    const generatedNomen = `${sku}_${conceptCode}_V${version}.mp4`;

    // PASO 5: Corte de clips con FFmpeg usando timestamps del análisis
    const clipsDir = path.join(tmpDir, 'clips');
    await fs.mkdir(clipsDir, { recursive: true });
    
    if (analysis.clips && analysis.clips.length > 0) {
        for (let i = 0; i < analysis.clips.length; i++) {
            const clip = analysis.clips[i];
            const rawName = (clip.name || 'CLIP').toUpperCase()
                .replace(/[^A-Z0-9]/g, '_')
                .replace(/_+/g, '_')
                .replace(/^_|_$/g, '');
            const name = rawName.slice(0, 20);
            const duration = clip.end - clip.start;
            if (duration > 0.5) {
                await execAsync(
                    `ffmpeg -i '${strippedPath}' -ss ${clip.start} -t ${duration} -c:v libx264 -crf 23 -c:a aac '${clipsDir}/${sku}_${conceptCode}_V${version}_${name}.mp4' -y`
                );
            }
        }
    } else {
        await execAsync(
            `ffmpeg -i '${strippedPath}' -f segment -segment_time 10 -c copy '${clipsDir}/SCENE_%02d.mp4' -y`
        );
    }
    updateJob(jobId, { status: 'SPLIT', progress: 80 });

    // Subir al path correcto en Drive
    // Normalizar drivePath: todo mayúsculas, formato C1_PROBLEMA/FRIO/2_PROBLEM_AWARE
    const rawDrivePath = (analysis.drivePath || `${conceptCode}_${analysis.conceptName || 'PROBLEMA'}/FRIO/2_PROBLEM_AWARE`)
        .toUpperCase()
        .replace(/\/COLD\//g, '/FRIO/')
        .replace(/\/WARM\//g, '/TEMPLADO/')
        .replace(/\/HOT[_A-Z]*\//g, '/CALIENTE/')
        .replace(/\/RETARGET[_A-Z]*\//g, '/RETARGETING/');
    const drivePath = `2_CREATIVOS/${rawDrivePath}`;
    
    let driveOptions: any = { 
        subfolderName: drivePath,
        conceptCode, 
        funnelStage: analysis.traffic, 
        angle: analysis.angle,
        fileType: 'VIDEO', 
        version 
    };

    if (hints.competitorSource) {
        const brand = conceptCode.replace('SPY_', '') || 'UNKNOWN';
        driveOptions.subfolderName = `4_COMPETENCIA/INBOX/SPY/COMPETENCIA/${brand}`;
    }

    const mainVideoUpload = await uploadToProduct(
      Buffer.from(await fs.readFile(strippedPath)),
      generatedNomen,
      file.type,
      productId,
      storeId,
      driveOptions
    );

    // 5.2 Subir Documento de Análisis (Google Doc)
    const analysisDocContent = `
ANÁLISIS CREATIVO — SPENCER PAWLING METHODOLOGY
================================================
Archivo: ${generatedNomen}
Ruta Drive: ${drivePath}/

CLASIFICACIÓN SPENCER
─────────────────────
Concepto: ${analysis.concept} — ${analysis.conceptName}
Tráfico: ${analysis.traffic}
Consciencia: ${analysis.awareness} — ${analysis.awarenessName}

ANÁLISIS DEL HOOK
─────────────────
Score: ${analysis.hookScore}/10
Tipo: ${analysis.hookType}
Framework: ${analysis.framework}
Ángulo: ${analysis.angle}
Avatar: ${analysis.avatar}
Emoción Pilar: ${analysis.emotionPillar}

TRANSCRIPCIÓN
─────────────
${transcription}

SHOT BREAKDOWN
──────────────
${(analysis.clips || []).map((c: any) => `[${c.start}s → ${c.end}s] ${c.name}`).join('\n')}

MEJORAS CONCRETAS
─────────────────
${analysis.improvements}

PLANTILLA REPLICABLE
────────────────────
${analysis.replicableTemplate}

────────────────────────────────────────
EcomBoom — Creative Forensic Agent
`.trim();

    await saveAnalysisDoc(productId, storeId, mainVideoUpload.parentFolderId, `ANALISIS_${generatedNomen.replace('.mp4', '')}`, analysisDocContent);

    // Actualizar DriveAsset con análisis forense completo — agentes pueden leerlo
    await (prisma as any).driveAsset.updateMany({
        where: { driveFileId: mainVideoUpload.driveFileId },
        data: {
            conceptCode,
            funnelStage: analysis.traffic,
            awarenessLevel: analysis.awareness,
            angle: analysis.angle,
            hookScore: analysis.hookScore,
            transcription,
            nomenclature: generatedNomen,
            analysisJson: JSON.stringify({
                concept: analysis.concept,
                conceptName: analysis.conceptName,
                traffic: analysis.traffic,
                awareness: analysis.awareness,
                awarenessName: analysis.awarenessName,
                hookScore: analysis.hookScore,
                hookType: analysis.hookType,
                framework: analysis.framework,
                angle: analysis.angle,
                avatar: analysis.avatar,
                emotionPillar: analysis.emotionPillar,
                clips: analysis.clips,
                improvements: analysis.improvements,
                replicableTemplate: analysis.replicableTemplate,
                drivePath: `${analysis.drivePath}/`,
            }),
            organized: true,
            agentReadable: true,
        }
    });

    // 5.3 Subir Clips detectados (Disecciones) y Guardar en DB
    const clipsFiles = (await fs.readdir(clipsDir)).filter(f => f.endsWith('.mp4'));
    const uploadedClips = [];
    for (let i = 0; i < clipsFiles.length; i++) {
        const clipFile = clipsFiles[i];
        const clipBuffer = await fs.readFile(path.join(clipsDir, clipFile));
        const clipNameTag = clipFile.replace('.mp4', '').split('_').slice(2).join('_');
        const clipNomen = `${sku}_${conceptCode}_V${version}_${clipNameTag}.mp4`.toUpperCase();
        
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
              version,
              subfolderName: `${drivePath}/CLIPS`
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
                versionNumber: version
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
              fileType: 'DOCUMENT', 
              version,
              subfolderName: drivePath
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
      type: analysis.framework || 'UGC', 
      versionNumber: version,
      hookText: analysis.hookType, 
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
          hookType: analysis.hookType,
          avatar: analysis.avatar, 
          awareness: analysis.awarenessName,
          traffic: analysis.traffic,
          suggestions: analysis.improvements,
          srtUrl,
          words // Store for precise bulk subtitle generation later
      })
    }
  });
 
    // Auto-trigger réplica si es vídeo de competencia
    const assetRecord = await (prisma as any).creativeAsset.findUnique({ 
        where: { id: assetId }, select: { tagsJson: true } 
    });
    const assetMeta = JSON.parse(assetRecord?.tagsJson || '{}');

    if (assetMeta.source === 'COMPETITOR' || hints.competitorSource) {
        // Fire & forget — generar réplica automáticamente
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        fetch(`${appUrl}/api/spy/replicate-with-product`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Store-Id': storeId },
            body: JSON.stringify({ competitorAssetId: assetId, productId })
        }).catch(() => {});
    }

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
