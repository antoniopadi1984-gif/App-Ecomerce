/**
 * POST /api/video-lab/translate
 * Traduce un vídeo con ElevenLabs Dubbing + LatentSync lip sync + subtítulos.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ElevenLabsService } from '@/lib/services/elevenlabs-service';
import { uploadToProduct } from '@/lib/services/drive-service';
import { generateSRT } from '@/lib/video/subtitle-utils';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const maxDuration = 300;

const execAsync = promisify(exec);

const SUPPORTED_LANGUAGES: Record<string, string> = {
    'es': 'Español', 'en': 'English', 'fr': 'Français', 'de': 'Deutsch',
    'it': 'Italiano', 'pt': 'Português', 'pl': 'Polski', 'hi': 'Hindi',
    'ar': 'العربية', 'zh': '中文', 'ja': '日本語', 'ko': '한국어',
    'ru': 'Русский', 'nl': 'Nederlands', 'sv': 'Svenska', 'tr': 'Türkçe',
};

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

export async function POST(req: NextRequest) {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vlab-translate-'));
    try {
        const { 
            assetId, targetLang, storeId, 
            burnSubtitles = true, lipSync = false,
            voiceId, speed = 1.0, stability = 0.5, style = 0.3,
            mode = 'dubbing' // 'dubbing' | 'tts'
        } = await req.json();

        if (!assetId || !targetLang || !storeId) return NextResponse.json({ error: 'assetId, targetLang y storeId son requeridos' }, { status: 400 });
        if (!SUPPORTED_LANGUAGES[targetLang]) return NextResponse.json({ error: `Idioma no soportado: ${targetLang}`, supported: Object.keys(SUPPORTED_LANGUAGES) }, { status: 400 });

        const asset = await (prisma as any).creativeAsset.findUnique({
            where: { id: assetId },
            select: { id: true, name: true, nomenclatura: true, driveFileId: true, productId: true, storeId: true, conceptCode: true, funnelStage: true, versionNumber: true, drivePath: true, language: true }
        });
        if (!asset) return NextResponse.json({ error: 'Asset no encontrado' }, { status: 404 });
        if (!asset.driveFileId) return NextResponse.json({ error: 'Asset sin archivo en Drive' }, { status: 400 });

        console.log(`[Translate] ${asset.nomenclatura} → ${targetLang} | mode: ${mode} | lipSync: ${lipSync}`);

        const { google } = await import('googleapis');
        const { getConnectionSecret } = await import('@/lib/server/connections');
        const saKey = await getConnectionSecret(storeId, 'GOOGLE_DRIVE');
        if (!saKey) return NextResponse.json({ error: 'Google Drive no configurado' }, { status: 400 });

        const drive = google.drive({ version: 'v3', auth: new google.auth.GoogleAuth({ credentials: JSON.parse(saKey), scopes: ['https://www.googleapis.com/auth/drive'] }) });

        // Descargar vídeo original
        const videoPath = path.join(tmpDir, 'original.mp4');
        const driveRes = await drive.files.get({ fileId: asset.driveFileId, alt: 'media', supportsAllDrives: true }, { responseType: 'stream' });
        await new Promise<void>((resolve, reject) => {
            const ws = require('fs').createWriteStream(videoPath);
            (driveRes.data as any).pipe(ws);
            ws.on('finish', resolve);
            ws.on('error', reject);
        });
        console.log('[Translate] Vídeo descargado');

        // ── MODO TTS: Transcribir → Traducir → TTS con voz elegida ──────────────
        if (mode === 'tts' && voiceId) {
            console.log(`[Translate] Modo TTS con voz: ${voiceId}`);
            
            // Extraer audio para transcripción
            const audioPath = path.join(tmpDir, 'audio_orig.mp3');
            await execAsync(`ffmpeg -i '${videoPath}' -vn -acodec mp3 '${audioPath}' -y`);
            
            // Transcribir con ElevenLabs Scribe
            const transcriptionResult = await ElevenLabsService.speechToText(
                new Blob([await fs.readFile(audioPath)], { type: 'audio/mp3' }), { storeId }
            );
            const originalText = transcriptionResult?.text || '';
            if (!originalText) throw new Error('No se pudo transcribir el audio original');
            
            // Traducir con Gemini
            const { AiRouter } = await import('@/lib/ai/router');
            const { TaskType } = await import('@/lib/ai/providers/interfaces');
            const translationResult = await AiRouter.dispatch(storeId, TaskType.COPYWRITING_DEEP,
                `Traduce al ${targetLang} este texto publicitario manteniendo exactamente el tono, urgencia y estructura. Devuelve SOLO el texto traducido:\n\n"${originalText}"`,
                {}
            );
            const translatedText = translationResult.text.replace(/^"|"$/g, '').trim();
            console.log(\`[Translate TTS] Texto traducido: \${translatedText.slice(0, 80)}...\`);
            
            // Generar audio con ElevenLabs TTS
            const ttsBuffer = await ElevenLabsService.textToSpeech(translatedText, voiceId, {
                stability,
                similarity_boost: 0.8,
                style,
                speed
            });
            
            // Reemplazar audio en el vídeo con FFmpeg
            const ttsAudioPath = path.join(tmpDir, 'tts_audio.mp3');
            await fs.writeFile(ttsAudioPath, ttsBuffer);
            const ttsVideoPath = path.join(tmpDir, 'tts_video.mp4');
            await execAsync(`ffmpeg -i '${videoPath}' -i '${ttsAudioPath}' -map 0:v -map 1:a -c:v copy -c:a aac -shortest '${ttsVideoPath}' -y`);
            
            // Generar SRT del texto traducido con timestamps aproximados
            const words = transcriptionResult?.words || [];
            let srtContent = '';
            if (words.length > 0) {
                // Proporcionar timestamps del original al texto traducido
                const wordsTranslated = translatedText.split(' ').map((word: string, i: number) => ({
                    text: word,
                    start: words[Math.min(i, words.length-1)]?.start || 0,
                    end: words[Math.min(i, words.length-1)]?.end || 1
                }));
                srtContent = generateSRT(wordsTranslated);
            }
            
            // Quemar subtítulos
            let finalPath = ttsVideoPath;
            if (burnSubtitles && srtContent) {
                const srtPath = path.join(tmpDir, 'subs.srt');
                const burnedPath = path.join(tmpDir, 'final_tts.mp4');
                await fs.writeFile(srtPath, srtContent);
                try {
                    await execAsync(\`ffmpeg -i '\${ttsVideoPath}' -vf "subtitles='\${srtPath}':force_style='FontSize=18,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2,Bold=1,Alignment=2'" -c:a copy '\${burnedPath}' -y\`);
                    finalPath = burnedPath;
                } catch {}
            }
            
            // Subir a Drive
            const langCode = targetLang.toUpperCase();
            const baseNomen = (asset.nomenclatura || asset.name).replace(/\.mp4$/i, '');
            const translatedNomen = \`\${baseNomen}_\${langCode}_TTS.mp4\`;
            const driveSubfolder = \`\${asset.drivePath || '2_CREATIVOS'}/\${langCode}\`;
            
            const videoUpload = await uploadToProduct(await fs.readFile(finalPath), translatedNomen, 'video/mp4', asset.productId, storeId, { subfolderName: driveSubfolder, conceptCode: asset.conceptCode, fileType: 'VIDEO', version: asset.versionNumber });
            
            let srtDriveUrl = '';
            if (srtContent) {
                const srtUp = await uploadToProduct(Buffer.from(srtContent), \`\${baseNomen}_\${langCode}.srt\`, 'text/plain', asset.productId, storeId, { subfolderName: driveSubfolder, conceptCode: asset.conceptCode, fileType: 'DOCUMENT', version: asset.versionNumber });
                srtDriveUrl = \`https://drive.google.com/file/d/\${srtUp.driveFileId}/view\`;
            }
            
            const translatedAsset = await (prisma as any).creativeAsset.create({
                data: { id: crypto.randomUUID(), storeId, productId: asset.productId, name: translatedNomen, nomenclatura: translatedNomen, type: 'VIDEO', language: targetLang, conceptCode: asset.conceptCode, funnelStage: asset.funnelStage, versionNumber: asset.versionNumber, driveFileId: videoUpload.driveFileId, driveUrl: \`https://drive.google.com/file/d/\${videoUpload.driveFileId}/view\`, drivePath: driveSubfolder, processingStatus: 'DONE', sourceAssetId: assetId, tagsJson: JSON.stringify({ mode: 'tts', voiceId, translatedFrom: asset.language || 'auto', translatedTo: targetLang, srtUrl: srtDriveUrl }) }
            });
            
            console.log(\`[Translate TTS] ✅ \${translatedNomen}\`);
            return NextResponse.json({ success: true, assetId: translatedAsset.id, nomenclatura: translatedNomen, driveUrl: \`https://drive.google.com/file/d/\${videoUpload.driveFileId}/view\`, srtUrl: srtDriveUrl, language: targetLang, mode: 'tts' });
        }

        // ── MODO DUBBING (ElevenLabs) ─────────────────────────────────────────
        // ElevenLabs Dubbing
        const driveViewUrl = `https://drive.google.com/uc?export=download&id=${asset.driveFileId}`;
        const dubbingJob = await ElevenLabsService.dubVideo(driveViewUrl, targetLang);
        const dubbingId = dubbingJob.dubbing_id;
        console.log(`[Translate] DubbingID: ${dubbingId}`);

        let status = 'dubbing';
        let attempts = 0;
        while (status === 'dubbing' && attempts < 48) {
            await new Promise(r => setTimeout(r, 5000));
            const s = await ElevenLabsService.getDubbingStatus(dubbingId);
            status = s.status;
            attempts++;
            console.log(`[Translate] dubbing: ${status} (${attempts * 5}s)`);
        }
        if (status !== 'dubbed') return NextResponse.json({ error: `Dubbing falló. Status: ${status}` }, { status: 500 });

        // Descargar vídeo doblado
        const apiKey = await getConnectionSecret(storeId, 'ELEVENLABS') || process.env.ELEVENLABS_API_KEY || '';
        const dubbedRes = await fetch(`https://api.elevenlabs.io/v1/dubbing/${dubbingId}/audio/${targetLang}`, { headers: { 'xi-api-key': apiKey } });
        if (!dubbedRes.ok) throw new Error(`Error descargando vídeo doblado: ${dubbedRes.statusText}`);

        const dubbedPath = path.join(tmpDir, `dubbed_${targetLang}.mp4`);
        await fs.writeFile(dubbedPath, Buffer.from(await dubbedRes.arrayBuffer()));
        console.log('[Translate] Vídeo doblado descargado');

        // LatentSync lip sync (opcional)
        let lipsyncPath = dubbedPath;
        if (lipSync) {
            try {
                const replicateToken = process.env.REPLICATE_API_TOKEN || '';
                if (!replicateToken) throw new Error('REPLICATE_API_TOKEN no configurado');

                // Extraer solo audio del vídeo doblado
                const audioOnlyPath = path.join(tmpDir, `audio_only_${targetLang}.wav`);
                await execAsync(`ffmpeg -i '${dubbedPath}' -vn -acodec pcm_s16le -ar 16000 '${audioOnlyPath}' -y`);

                // Subir audio a Drive temporalmente para URL pública
                const audioBuffer = await fs.readFile(audioOnlyPath);
                const audioUpload = await uploadToProduct(audioBuffer, `tmp_audio_${Date.now()}.wav`, 'audio/wav', asset.productId, storeId, { subfolderName: '_TMP', fileType: 'DOCUMENT' });
                const audioUrl = `https://drive.google.com/uc?export=download&id=${audioUpload.driveFileId}`;
                const videoUrl = `https://drive.google.com/uc?export=download&id=${asset.driveFileId}`;

                console.log('[LipSync] Iniciando LatentSync...');
                const lipsyncUrl = await runLatentSync(videoUrl, audioUrl, replicateToken);

                // Descargar resultado del lip sync
                const lipsyncRes = await fetch(lipsyncUrl);
                if (lipsyncRes.ok) {
                    lipsyncPath = path.join(tmpDir, `lipsync_${targetLang}.mp4`);
                    await fs.writeFile(lipsyncPath, Buffer.from(await lipsyncRes.arrayBuffer()));
                    console.log('[LipSync] ✅ Lip sync completado');

                    // Mezclar audio doblado con vídeo lip-synced
                    const mergedPath = path.join(tmpDir, `merged_${targetLang}.mp4`);
                    await execAsync(`ffmpeg -i '${lipsyncPath}' -i '${dubbedPath}' -map 0:v -map 1:a -c:v copy -c:a aac '${mergedPath}' -y`);
                    lipsyncPath = mergedPath;

                    // Limpiar archivo temporal de audio de Drive
                    try {
                        const { google: g2 } = await import('googleapis');
                        const d2 = g2.drive({ version: 'v3', auth: new g2.auth.GoogleAuth({ credentials: JSON.parse(saKey), scopes: ['https://www.googleapis.com/auth/drive'] }) });
                        await d2.files.delete({ fileId: audioUpload.driveFileId, supportsAllDrives: true });
                    } catch {}
                }
            } catch (lsErr: any) {
                console.warn(`[LipSync] Falló, usando audio doblado sin lip sync: ${lsErr.message}`);
                lipsyncPath = dubbedPath;
            }
        }

        // Generar SRT del audio traducido
        let srtContent = '';
        try {
            const audioPath = path.join(tmpDir, 'audio_srt.mp3');
            await execAsync(`ffmpeg -i '${lipsyncPath}' -vn -acodec mp3 '${audioPath}' -y`);
            const transcriptionResult = await ElevenLabsService.speechToText(new Blob([await fs.readFile(audioPath)], { type: 'audio/mp3' }), { storeId });
            const words = transcriptionResult?.words || [];
            if (words.length > 0) srtContent = generateSRT(words.map((w: any) => ({ text: w.text, start: w.start, end: w.end })));
            console.log(`[Translate] SRT: ${words.length} palabras`);
        } catch (e: any) { console.warn(`[Translate] SRT error: ${e.message}`); }

        // Quemar subtítulos
        let finalVideoPath = lipsyncPath;
        if (burnSubtitles && srtContent) {
            const srtPath = path.join(tmpDir, 'subs.srt');
            const burnedPath = path.join(tmpDir, 'final.mp4');
            await fs.writeFile(srtPath, srtContent);
            try {
                await execAsync(`ffmpeg -i '${lipsyncPath}' -vf "subtitles='${srtPath}':force_style='FontSize=18,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2,Bold=1,Alignment=2'" -c:a copy '${burnedPath}' -y`);
                finalVideoPath = burnedPath;
                console.log('[Translate] Subtítulos quemados');
            } catch (e: any) { console.warn(`[Translate] Burn subs: ${e.message}`); }
        }

        // Subir a Drive
        const langCode = targetLang.toUpperCase();
        const baseNomen = (asset.nomenclatura || asset.name).replace(/\.mp4$/i, '');
        const translatedNomen = `${baseNomen}_${langCode}.mp4`;
        const driveSubfolder = `${asset.drivePath || '2_CREATIVOS'}/${langCode}`;

        const videoUpload = await uploadToProduct(await fs.readFile(finalVideoPath), translatedNomen, 'video/mp4', asset.productId, storeId, { subfolderName: driveSubfolder, conceptCode: asset.conceptCode, fileType: 'VIDEO', version: asset.versionNumber });

        let srtDriveUrl = '';
        if (srtContent) {
            const srtUpload = await uploadToProduct(Buffer.from(srtContent), `${baseNomen}_${langCode}.srt`, 'text/plain', asset.productId, storeId, { subfolderName: driveSubfolder, conceptCode: asset.conceptCode, fileType: 'DOCUMENT', version: asset.versionNumber });
            srtDriveUrl = `https://drive.google.com/file/d/${srtUpload.driveFileId}/view`;
        }

        const translatedAsset = await (prisma as any).creativeAsset.create({
            data: { id: crypto.randomUUID(), storeId, productId: asset.productId, name: translatedNomen, nomenclatura: translatedNomen, type: 'VIDEO', language: targetLang, conceptCode: asset.conceptCode, funnelStage: asset.funnelStage, versionNumber: asset.versionNumber, driveFileId: videoUpload.driveFileId, driveUrl: `https://drive.google.com/file/d/${videoUpload.driveFileId}/view`, drivePath: driveSubfolder, processingStatus: 'DONE', sourceAssetId: assetId, tagsJson: JSON.stringify({ translatedFrom: asset.language || 'en', translatedTo: targetLang, dubbingId, srtUrl: srtDriveUrl, lipSync }) }
        });

        console.log(`[Translate] ✅ ${translatedNomen}`);
        return NextResponse.json({ success: true, assetId: translatedAsset.id, nomenclatura: translatedNomen, driveUrl: `https://drive.google.com/file/d/${videoUpload.driveFileId}/view`, srtUrl: srtDriveUrl, language: targetLang, languageName: SUPPORTED_LANGUAGES[targetLang], dubbingId, lipSyncApplied: lipSync && lipsyncPath !== dubbedPath });

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
