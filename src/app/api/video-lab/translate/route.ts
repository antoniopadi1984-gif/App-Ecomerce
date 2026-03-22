/**
 * POST /api/video-lab/translate
 * Traduce un vídeo con dos modos:
 *   - mode=tts   → Transcribir → Traducir → TTS ElevenLabs → reemplazar audio → quemar subtítulos
 *   - mode=dubbing → ElevenLabs Dubbing API + lip sync opcional + subtítulos
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ElevenLabsService } from '@/lib/services/elevenlabs-service';
import { uploadToProduct } from '@/lib/services/drive-service';
import { generateSRT } from '@/lib/video/subtitle-utils';
import { exec, execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const maxDuration = 300;

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);
// Path absoluto de ffmpeg — Next.js puede no tener /opt/homebrew/bin en su PATH
const FFMPEG = process.env.FFMPEG_PATH || '/opt/homebrew/bin/ffmpeg';


const SUPPORTED_LANGUAGES: Record<string, string> = {
    'es': 'Español', 'en': 'English', 'fr': 'Français', 'de': 'Deutsch',
    'it': 'Italiano', 'pt': 'Português', 'pl': 'Polski', 'hi': 'Hindi',
    'ar': 'العربية', 'zh': '中文', 'ja': '日本語', 'ko': '한국어',
    'ru': 'Русский', 'nl': 'Nederlands', 'sv': 'Svenska', 'tr': 'Türkçe',
};

// ── LatentSync lip sync via Replicate ────────────────────────────────────────
async function runLatentSync(videoUrl: string, audioUrl: string, replicateToken: string): Promise<string> {
    const LATENTSYNC_VERSION = '637ce1919f807ca20da37abb26657b28b1e8f1a49d2b27a90fbe2f3bc20d86d0';
    const res = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: { 'Authorization': `Token ${replicateToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: LATENTSYNC_VERSION, input: { video: videoUrl, audio: audioUrl, guidance_scale: 2.0, inference_steps: 25 } })
    });
    const pred = await res.json();
    if (pred.error) throw new Error(`LatentSync error: ${pred.error}`);

    let result = pred;
    let attempts = 0;
    while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < 60) {
        await new Promise(r => setTimeout(r, 5000));
        const poll = await fetch(`https://api.replicate.com/v1/predictions/${pred.id}`, {
            headers: { 'Authorization': `Token ${replicateToken}` }
        });
        result = await poll.json();
        attempts++;
        console.log(`[LipSync] status: ${result.status} (${attempts * 5}s)`);
    }
    if (result.status !== 'succeeded') throw new Error(`LatentSync falló: ${result.status} — ${result.error || 'timeout'}`);
    return Array.isArray(result.output) ? result.output[0] : result.output;
}

// ── Quemar subtítulos con libass (soporte completo tildes y unicode) ─────────
function srtToAss(srtContent: string): string {
    const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,72,&H00000000,&H000000FF,&H00FFFFFF,&HFFFFFFFF,1,0,0,0,100,100,0,0,1,4,0,2,20,20,50,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
    const toT = (s: number) => {
        const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = Math.floor(s%60), cs = Math.round((s%1)*100);
        return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}.${String(cs).padStart(2,'0')}`;
    };
    const lines: string[] = [];
    const blocks = srtContent.trim().split(/\n\s*\n/);
    for (const block of blocks) {
        const parts = block.trim().split('\n');
        if (parts.length < 3) continue;
        const t = parts[1].match(/(\d+):(\d+):(\d+),(\d+)\s*-->\s*(\d+):(\d+):(\d+),(\d+)/);
        if (!t) continue;
        const start = +t[1]*3600 + +t[2]*60 + +t[3] + +t[4]/1000;
        const end = +t[5]*3600 + +t[6]*60 + +t[7] + +t[8]/1000;
        const text = parts.slice(2).join(' ').replace(/\{[^}]+\}/g,'').replace(/\n/g,'\\N').replace(/\s+/g,' ').trim();
        lines.push(`Dialogue: 0,${toT(start)},${toT(end)},Default,,0,0,0,,${text}`);
    }
    return header + lines.join('\n');
}

async function burnSubs(videoPath: string, srtPath: string, outputPath: string): Promise<boolean> {
    try {
        const fsSync = require('fs');
        const srtContent = fsSync.readFileSync(srtPath, 'utf8');
        const assContent = srtToAss(srtContent);
        const assPath = srtPath.replace('.srt', '.ass');
        fsSync.writeFileSync(assPath, assContent, 'utf8');
        const escapedAss = assPath.replace(/\\/g, '/').replace(/:/g, '\\:');
        await execAsync(`ffmpeg -i '${videoPath}' -vf "ass='${assPath}'" -c:a copy '${outputPath}' -y`);
        return true;
    } catch(e: any) {
        console.warn(`[Translate] burnSubs falló: ${e.message?.slice(0,200)}`);
        return false;
    }
}




export async function POST(req: NextRequest) {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vlab-translate-'));
    try {
        const {
            assetId,
            targetLang,
            storeId,
            mode = 'tts',           // 'tts' | 'dubbing'
            voiceId,                // requerido en modo tts
            speed = 1.0,
            stability = 0.5,
            style = 0.3,
            burnSubtitles = true,
            doLipSync = false,      // renombrado para evitar conflicto
        } = await req.json();

        if (!assetId || !targetLang || !storeId)
            return NextResponse.json({ error: 'assetId, targetLang y storeId son requeridos' }, { status: 400 });
        if (!SUPPORTED_LANGUAGES[targetLang])
            return NextResponse.json({ error: `Idioma no soportado: ${targetLang}`, supported: Object.keys(SUPPORTED_LANGUAGES) }, { status: 400 });

        // Buscar asset en BD
        const asset = await (prisma as any).creativeAsset.findUnique({
            where: { id: assetId },
            select: { id: true, name: true, nomenclatura: true, driveFileId: true, productId: true, storeId: true, conceptCode: true, funnelStage: true, versionNumber: true, drivePath: true, language: true }
        });
        if (!asset) return NextResponse.json({ error: 'Asset no encontrado' }, { status: 404 });
        if (!asset.driveFileId) return NextResponse.json({ error: 'Asset sin archivo en Drive' }, { status: 400 });

        console.log(`[Translate] ${asset.nomenclatura} → ${targetLang} | mode: ${mode} | lipSync: ${doLipSync}`);

        // Autenticar Google Drive
        const { google } = await import('googleapis');
        const { getConnectionSecret } = await import('@/lib/server/connections');
        // La clave SA de Google está guardada como 'GOOGLE_CLOUD' (no 'GOOGLE_DRIVE')
        const saKey = await getConnectionSecret(storeId, 'GOOGLE_CLOUD')
            || process.env.GOOGLE_SERVICE_ACCOUNT_KEY
            || null;
        if (!saKey) return NextResponse.json({ error: 'Google Drive / Service Account no configurado. Ve a Configuración → Conexiones y añade tu clave de Google Cloud.' }, { status: 400 });

        const driveAuth = new google.auth.GoogleAuth({ credentials: JSON.parse(saKey), scopes: ['https://www.googleapis.com/auth/drive'] });
        const drive = google.drive({ version: 'v3', auth: driveAuth });

        // Descargar vídeo original desde Drive
        const videoPath = path.join(tmpDir, 'original.mp4');
        const driveRes = await drive.files.get({ fileId: asset.driveFileId, alt: 'media', supportsAllDrives: true }, { responseType: 'stream' });
        await new Promise<void>((resolve, reject) => {
            const ws = require('fs').createWriteStream(videoPath);
            (driveRes.data as any).pipe(ws);
            ws.on('finish', resolve);
            ws.on('error', reject);
        });
        console.log('[Translate] Vídeo original descargado');

        // ─────────────────────────────────────────────────────────────────────
        // MODO TTS: Transcripción → Traducción → TTS → Subtítulos quemados
        // ─────────────────────────────────────────────────────────────────────
        if (mode === 'tts') {
            if (!voiceId) return NextResponse.json({ error: 'voiceId requerido en modo tts' }, { status: 400 });

            // 1. Extraer audio del vídeo
            const audioOrigPath = path.join(tmpDir, 'audio_orig.mp3');
            await execAsync(`${FFMPEG} -i '${videoPath}' -vn -acodec mp3 -q:a 2 '${audioOrigPath}' -y`);
            console.log('[Translate TTS] Audio extraído');

            // 2. Transcribir con ElevenLabs Scribe (incluye timestamps por palabra)
            const transcriptionResult = await ElevenLabsService.speechToText(
                new Blob([await fs.readFile(audioOrigPath)], { type: 'audio/mp3' }), { storeId }
            );
            const originalText = transcriptionResult?.text || '';
            const originalWords = transcriptionResult?.words || [];
            if (!originalText) throw new Error('No se pudo transcribir el audio original');
            console.log(`[Translate TTS] Transcripción: "${originalText.slice(0, 80)}..."`);

            // 3. Traducir con IA
            const { AiRouter } = await import('@/lib/ai/router');
            const { TaskType } = await import('@/lib/ai/providers/interfaces');
            const translationResult = await AiRouter.dispatch(
                storeId,
                TaskType.SCRIPTS_ADVANCED,
                `Traduce al ${SUPPORTED_LANGUAGES[targetLang] || targetLang} este texto publicitario. ` +
                `Mantén exactamente el tono, urgencia, pausas naturales y estructura. ` +
                `Devuelve ÚNICAMENTE el texto traducido, sin comillas ni explicaciones:\n\n${originalText}`,
                {}
            );
            const translatedText = translationResult.text.replace(/^["']|["']$/g, '').trim();
            console.log(`[Translate TTS] Traducción: "${translatedText.slice(0, 80)}..."`);

            // 4. Generar audio TTS con la voz elegida
            const ttsBuffer = await ElevenLabsService.textToSpeech(translatedText, voiceId, {
                stability,
                similarity_boost: 0.8,
                style,
                speed,
            });
            const ttsAudioPath = path.join(tmpDir, 'tts_audio.mp3');
            await fs.writeFile(ttsAudioPath, ttsBuffer);
            console.log('[Translate TTS] Audio TTS generado');

            // 5. Obtener duraciones con ffprobe y ajustar velocidad de vídeo al audio TTS
            const [vDurRes, aDurRes] = await Promise.all([
                execAsync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 '${videoPath}'`).catch(() => ({ stdout: '0' })),
                execAsync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 '${ttsAudioPath}'`).catch(() => ({ stdout: '0' }))
            ]);
            const videoDuration = parseFloat(vDurRes.stdout.trim()) || 0;
            const audioDuration = parseFloat(aDurRes.stdout.trim()) || 0;
            console.log(`[Translate TTS] Video: ${videoDuration.toFixed(2)}s | TTS Audio: ${audioDuration.toFixed(2)}s`);

            // ─── SYNC DUAL-EJE: distribuir ajuste entre vídeo y audio ───────────────
            // En lugar de acelerar solo el audio (lo que lo hace sonar robótico),
            // dividimos el ajuste:
            //   1. Ralentizamos el vídeo hasta un máx del 20% (factor vídeo mín = 0.80)
            //   2. El resto del ajuste va al audio (siempre << 1.4x)
            // Ejemplo: audio=103s, video=73s → ratio=1.400
            //   videoFactor=0.80 → nuevaDuraciónVideo=73/0.80=91.25s
            //   audioFactor=103/91.25=1.129 (mucho más natural)
            // ────────────────────────────────────────────────────────────────────────
            const ttsVideoPath = path.join(tmpDir, 'tts_video.mp4');
            if (audioDuration > 0 && videoDuration > 0 && Math.abs(audioDuration - videoDuration) > 0.3) {
                const ratio = audioDuration / videoDuration; // e.g. 1.40

                // Calcular el factor de ralentización del vídeo (máx 20%)
                const VIDEO_SLOWDOWN_MAX = 0.80; // mínimo 0.80x (20% más lento)
                const AUDIO_MAX = 1.60;           // máximo que aceleramos el audio

                // ¿Cuánto del ajuste cargamos al vídeo?
                // Queremos que videoFactor * audioFactor = ratio
                // Optamos por videoFactor = max(VIDEO_SLOWDOWN_MAX, 1/sqrt(ratio)) — punto medio geométrico
                let videoFactor = Math.max(VIDEO_SLOWDOWN_MAX, 1.0 / Math.sqrt(ratio));
                let audioFactor = ratio / videoFactor;

                // Si audioFactor todavía > AUDIO_MAX, cargamos más al vídeo
                if (audioFactor > AUDIO_MAX) {
                    audioFactor = AUDIO_MAX;
                    videoFactor = ratio / audioFactor;
                }

                const newVideoDuration = videoDuration / videoFactor;
                console.log(
                    `[Translate TTS] Sync dual-eje: ratio=${ratio.toFixed(3)}x ` +
                    `→ vídeo ×${videoFactor.toFixed(3)} (${videoDuration.toFixed(1)}s→${newVideoDuration.toFixed(1)}s) ` +
                    `+ audio ×${audioFactor.toFixed(3)}`
                );

                // Paso A: Ralentizar vídeo con setpts (no recodifica pixel-quality, solo timestamps)
                const slowVideoPath = path.join(tmpDir, 'slow_video.mp4');
                const ptsExpr = (1.0 / videoFactor).toFixed(6);
                await execAsync(
                    `${FFMPEG} -i '${videoPath}' -vf "setpts=${ptsExpr}*PTS" -an -c:v libx264 -crf 18 -preset fast '${slowVideoPath}' -y`
                );

                // Paso B: Acelerar el audio TTS en audioFactor
                const speededAudioPath = path.join(tmpDir, 'tts_speeded.mp3');
                let atempoFilter: string;
                if (audioFactor <= 2.0) {
                    atempoFilter = `atempo=${audioFactor.toFixed(6)}`;
                } else {
                    atempoFilter = `atempo=2.0,atempo=${(audioFactor / 2.0).toFixed(6)}`;
                }
                await execAsync(
                    `${FFMPEG} -i '${ttsAudioPath}' -filter:a "${atempoFilter}" '${speededAudioPath}' -y`
                );

                // Paso C: Mezclar vídeo lento + audio ajustado
                await execAsync(
                    `${FFMPEG} -i '${slowVideoPath}' -i '${speededAudioPath}' ` +
                    `-map 0:v -map 1:a -c:v copy -c:a aac -shortest '${ttsVideoPath}' -y`
                );
            } else {
                await execAsync(
                    `${FFMPEG} -i '${videoPath}' -i '${ttsAudioPath}' ` +
                    `-map 0:v -map 1:a -c:v copy -c:a aac -shortest '${ttsVideoPath}' -y`
                );
            }
            console.log('[Translate TTS] Audio TTS sincronizado con vídeo');


            // 6. Transcribir el audio TTS para obtener timestamps REALES del texto traducido
            //    Esto es crítico para que los subtítulos estén en el idioma correcto y sincronizados
            let srtContent = '';
            try {
                const ttsTranscription = await ElevenLabsService.speechToText(
                    new Blob([new Uint8Array(ttsBuffer)], { type: 'audio/mp3' }),
                    { storeId, language: targetLang }   // forzar idioma destino para transcripción
                );
                const ttsWords = ttsTranscription?.words || [];
                if (ttsWords.length > 0) {
                    srtContent = generateSRT(ttsWords.map((w: any) => ({ text: w.text, start: w.start, end: w.end })));
                    console.log(`[Translate TTS] SRT generado con ${ttsWords.length} palabras del audio TTS`);
                } else if (ttsTranscription?.text) {
                    // Fallback: texto plano sin timestamps → distribución proporcional
                    const dur = audioDuration || 60;
                    const words = ttsTranscription.text.split(' ');
                    const wordsWithTimes = words.map((w, i) => ({
                        text: w,
                        start: (i / words.length) * dur,
                        end: ((i + 1) / words.length) * dur
                    }));
                    srtContent = generateSRT(wordsWithTimes);
                }
            } catch (srtErr: any) {
                // Último fallback: usar el texto traducido con tiempo proporcional
                console.warn(`[Translate TTS] Transcripción TTS fallida: ${srtErr.message}`);
                const dur = audioDuration || 60;
                const words = translatedText.split(' ');
                const wordsWithTimes = words.map((w, i) => ({
                    text: w,
                    start: (i / words.length) * dur,
                    end: ((i + 1) / words.length) * dur
                }));
                srtContent = generateSRT(wordsWithTimes);
                console.log(`[Translate TTS] SRT fallback con ${words.length} palabras del texto traducido`);
            }

            // 7. Quemar subtítulos con detección automática de posición (OpenCV+Tesseract)
            let finalPath = ttsVideoPath;
            if (burnSubtitles && srtContent) {
                const srtPath = path.join(tmpDir, 'subs_tts.srt');
                const burnedPath = path.join(tmpDir, 'final_tts.mp4');
                await fs.writeFile(srtPath, srtContent);
                try {
                    const scriptPath = path.join(process.cwd(), 'scripts', 'subtitle_injector.py');
                    const pythonBin = process.env.PYTHON_BIN || 'python3';
                    // Usamos execFileAsync para evitar problemas de quoting con rutas con espacios
                    const { stderr } = await execFileAsync(
                        pythonBin,
                        [scriptPath, '--video', ttsVideoPath, '--srt', srtPath, '--out', burnedPath],
                        { maxBuffer: 50 * 1024 * 1024 }
                    );
                    if (stderr) console.log('[SubtitleInjector]', stderr.slice(0, 500));
                    const exists = await fs.access(burnedPath).then(() => true).catch(() => false);
                    if (exists) {
                        finalPath = burnedPath;
                        console.log('[Translate TTS] ✅ Subtítulos inyectados con detección automática');
                    } else {
                        throw new Error('subtitle_injector no produjo archivo de salida');
                    }
                } catch (burnErr: any) {
                    console.warn('[Translate TTS] subtitle_injector falló, usando burnSubs:', burnErr.message?.slice(0,200));
                    const burned = await burnSubs(ttsVideoPath, srtPath, burnedPath);
                    if (burned) finalPath = burnedPath;
                }
            }

            // 8. Subir vídeo final a Drive
            const langCode = targetLang.toUpperCase();
            const baseNomen = (asset.nomenclatura || asset.name).replace(/\.mp4$/i, '');
            const translatedNomen = `${baseNomen}_${langCode}_TTS.mp4`;
            const driveSubfolder = `${asset.drivePath || '2_CREATIVOS'}/${langCode}`;

            const videoUpload = await uploadToProduct(
                await fs.readFile(finalPath), translatedNomen, 'video/mp4',
                asset.productId, storeId,
                { subfolderName: driveSubfolder, conceptCode: asset.conceptCode, fileType: 'VIDEO', version: asset.versionNumber }
            );

            // 9. Subir SRT a Drive
            let srtDriveUrl = '';
            if (srtContent) {
                const srtUp = await uploadToProduct(
                    Buffer.from(srtContent), `${baseNomen}_${langCode}.srt`, 'text/plain',
                    asset.productId, storeId,
                    { subfolderName: driveSubfolder, conceptCode: asset.conceptCode, fileType: 'DOCUMENT', version: asset.versionNumber }
                );
                srtDriveUrl = `https://drive.google.com/file/d/${srtUp.driveFileId}/view`;
            }

            // 10. Crear asset en BD
            const translatedAsset = await (prisma as any).creativeAsset.create({
                data: {
                    id: crypto.randomUUID(), storeId, productId: asset.productId,
                    name: translatedNomen, nomenclatura: translatedNomen,
                    type: 'VIDEO', language: targetLang,
                    conceptCode: asset.conceptCode, funnelStage: asset.funnelStage,
                    versionNumber: asset.versionNumber,
                    driveFileId: videoUpload.driveFileId,
                    driveUrl: `https://drive.google.com/file/d/${videoUpload.driveFileId}/view`,
                    drivePath: driveSubfolder, processingStatus: 'DONE',
                    sourceAssetId: assetId,
                    tagsJson: JSON.stringify({ mode: 'tts', voiceId, translatedFrom: asset.language || 'auto', translatedTo: targetLang, srtUrl: srtDriveUrl })
                }
            });

            console.log(`[Translate TTS] ✅ ${translatedNomen}`);
            return NextResponse.json({
                success: true, assetId: translatedAsset.id,
                nomenclatura: translatedNomen,
                driveUrl: `https://drive.google.com/file/d/${videoUpload.driveFileId}/view`,
                srtUrl: srtDriveUrl, language: targetLang,
                languageName: SUPPORTED_LANGUAGES[targetLang], mode: 'tts'
            });
        }

        // ─────────────────────────────────────────────────────────────────────
        // MODO DUBBING: ElevenLabs Dubbing API
        // ─────────────────────────────────────────────────────────────────────
        // El vídeo ya está descargado en videoPath (tmpDir)
        // ElevenLabs no puede acceder a URLs privadas de Drive → subimos el archivo directamente
        const apiKey = await getConnectionSecret(storeId, 'ELEVENLABS') || process.env.ELEVENLABS_API_KEY || '';
        if (!apiKey) return NextResponse.json({ error: 'ELEVENLABS_API_KEY no configurado' }, { status: 400 });

        console.log('[Translate] Subiendo vídeo a ElevenLabs Dubbing (multipart)...');
        const dubFormData = new FormData();
        const videoBuffer = await fs.readFile(videoPath);
        dubFormData.append('file', new Blob([videoBuffer], { type: 'video/mp4' }), path.basename(videoPath));
        dubFormData.append('target_lang', targetLang);
        dubFormData.append('source_lang', 'auto');
        dubFormData.append('num_speakers', '0');
        dubFormData.append('watermark', 'false');
        dubFormData.append('highest_resolution', 'true');

        const dubRes = await fetch('https://api.elevenlabs.io/v1/dubbing', {
            method: 'POST',
            headers: { 'xi-api-key': apiKey },
            body: dubFormData
        });
        if (!dubRes.ok) {
            const err = await dubRes.json().catch(() => ({}));
            throw new Error(`ElevenLabs dubbing error: ${(err as any).detail || dubRes.statusText}`);
        }
        const dubbingJob = await dubRes.json();
        const dubbingId = dubbingJob.dubbing_id;
        console.log(`[Translate] DubbingID: ${dubbingId}`);

        // Polling hasta que el dubbing termine
        let status = 'dubbing';
        let attempts = 0;
        while (status === 'dubbing' && attempts < 48) {
            await new Promise(r => setTimeout(r, 5000));
            const s = await ElevenLabsService.getDubbingStatus(dubbingId);
            status = s.status;
            attempts++;
            console.log(`[Translate] dubbing: ${status} (${attempts * 5}s)`);
        }
        if (status !== 'dubbed')
            return NextResponse.json({ error: `Dubbing falló. Status: ${status}` }, { status: 500 });

        // Descargar vídeo doblado
        const dubbedRes = await fetch(`https://api.elevenlabs.io/v1/dubbing/${dubbingId}/audio/${targetLang}`, {
            headers: { 'xi-api-key': apiKey }
        });
        if (!dubbedRes.ok) throw new Error(`Error descargando vídeo doblado: ${dubbedRes.statusText}`);

        const dubbedPath = path.join(tmpDir, `dubbed_${targetLang}.mp4`);
        await fs.writeFile(dubbedPath, Buffer.from(await dubbedRes.arrayBuffer()));
        console.log('[Translate] Vídeo doblado descargado');

        // LatentSync (lip sync opcional)
        let lipsyncPath = dubbedPath;
        if (doLipSync) {
            try {
                const replicateToken = process.env.REPLICATE_API_TOKEN || '';
                if (!replicateToken) throw new Error('REPLICATE_API_TOKEN no configurado');

                const audioOnlyPath = path.join(tmpDir, `audio_only_${targetLang}.wav`);
                await execAsync(`${FFMPEG} -i '${dubbedPath}' -vn -acodec pcm_s16le -ar 16000 '${audioOnlyPath}' -y`);

                const audioBuffer = await fs.readFile(audioOnlyPath);
                const audioUpload = await uploadToProduct(audioBuffer, `tmp_audio_${Date.now()}.wav`, 'audio/wav', asset.productId, storeId, { subfolderName: '_TMP', fileType: 'DOCUMENT' });
                const audioUrl = `https://drive.google.com/uc?export=download&id=${audioUpload.driveFileId}`;
                const videoUrl = `https://drive.google.com/uc?export=download&id=${asset.driveFileId}`;

                console.log('[LipSync] Iniciando LatentSync...');
                const lipsyncUrl = await runLatentSync(videoUrl, audioUrl, replicateToken);

                const lipsyncRes = await fetch(lipsyncUrl);
                if (lipsyncRes.ok) {
                    lipsyncPath = path.join(tmpDir, `lipsync_${targetLang}.mp4`);
                    await fs.writeFile(lipsyncPath, Buffer.from(await lipsyncRes.arrayBuffer()));

                    const mergedPath = path.join(tmpDir, `merged_${targetLang}.mp4`);
                    await execAsync(`${FFMPEG} -i '${lipsyncPath}' -i '${dubbedPath}' -map 0:v -map 1:a -c:v copy -c:a aac '${mergedPath}' -y`);
                    lipsyncPath = mergedPath;
                    console.log('[LipSync] ✅ Lip sync + merge completado');

                    // Limpiar archivo temporal
                    try { await drive.files.delete({ fileId: audioUpload.driveFileId, supportsAllDrives: true }); } catch {}
                }
            } catch (lsErr: any) {
                console.warn(`[LipSync] Falló, usando audio doblado sin lip sync: ${lsErr.message}`);
                lipsyncPath = dubbedPath;
            }
        }

        // Generar SRT del audio doblado/lip-synced (transcribir el audio final)
        let srtContent = '';
        try {
            const audioPath = path.join(tmpDir, 'audio_srt.mp3');
            await execAsync(`${FFMPEG} -i '${lipsyncPath}' -vn -acodec mp3 -q:a 2 '${audioPath}' -y`);
            const transcriptionResult = await ElevenLabsService.speechToText(
                new Blob([await fs.readFile(audioPath)], { type: 'audio/mp3' }), { storeId }
            );
            const words = transcriptionResult?.words || [];
            if (words.length > 0) {
                srtContent = generateSRT(words.map((w: any) => ({ text: w.text, start: w.start, end: w.end })));
                console.log(`[Translate] SRT: ${words.length} palabras`);
            }
        } catch (e: any) { console.warn(`[Translate] SRT error: ${e.message}`); }

        // Quemar subtítulos
        let finalVideoPath = lipsyncPath;
        if (burnSubtitles && srtContent) {
            const srtPath = path.join(tmpDir, 'subs.srt');
            const burnedPath = path.join(tmpDir, 'final_dubbed.mp4');
            await fs.writeFile(srtPath, srtContent);
            const burned = await burnSubs(lipsyncPath, srtPath, burnedPath);
            if (burned) {
                finalVideoPath = burnedPath;
                console.log('[Translate] Subtítulos quemados sobre vídeo doblado');
            }
        }

        // Subir a Drive
        const langCode = targetLang.toUpperCase();
        const baseNomen = (asset.nomenclatura || asset.name).replace(/\.mp4$/i, '');
        const translatedNomen = `${baseNomen}_${langCode}.mp4`;
        const driveSubfolder = `${asset.drivePath || '2_CREATIVOS'}/${langCode}`;

        const videoUpload = await uploadToProduct(
            await fs.readFile(finalVideoPath), translatedNomen, 'video/mp4',
            asset.productId, storeId,
            { subfolderName: driveSubfolder, conceptCode: asset.conceptCode, fileType: 'VIDEO', version: asset.versionNumber }
        );

        let srtDriveUrl = '';
        if (srtContent) {
            const srtUpload = await uploadToProduct(
                Buffer.from(srtContent), `${baseNomen}_${langCode}.srt`, 'text/plain',
                asset.productId, storeId,
                { subfolderName: driveSubfolder, conceptCode: asset.conceptCode, fileType: 'DOCUMENT', version: asset.versionNumber }
            );
            srtDriveUrl = `https://drive.google.com/file/d/${srtUpload.driveFileId}/view`;
        }

        const translatedAsset = await (prisma as any).creativeAsset.create({
            data: {
                id: crypto.randomUUID(), storeId, productId: asset.productId,
                name: translatedNomen, nomenclatura: translatedNomen,
                type: 'VIDEO', language: targetLang,
                conceptCode: asset.conceptCode, funnelStage: asset.funnelStage,
                versionNumber: asset.versionNumber,
                driveFileId: videoUpload.driveFileId,
                driveUrl: `https://drive.google.com/file/d/${videoUpload.driveFileId}/view`,
                drivePath: driveSubfolder, processingStatus: 'DONE',
                sourceAssetId: assetId,
                tagsJson: JSON.stringify({ translatedFrom: asset.language || 'auto', translatedTo: targetLang, dubbingId, srtUrl: srtDriveUrl, lipSync: doLipSync })
            }
        });

        console.log(`[Translate] ✅ ${translatedNomen}`);
        return NextResponse.json({
            success: true, assetId: translatedAsset.id,
            nomenclatura: translatedNomen,
            driveUrl: `https://drive.google.com/file/d/${videoUpload.driveFileId}/view`,
            srtUrl: srtDriveUrl, language: targetLang,
            languageName: SUPPORTED_LANGUAGES[targetLang],
            dubbingId, lipSyncApplied: doLipSync && lipsyncPath !== dubbedPath,
            mode: 'dubbing'
        });

    } catch (err: any) {
        console.error('[Translate] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
    }
}

export async function GET() {
    return NextResponse.json({ supported_languages: SUPPORTED_LANGUAGES });
}
