import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

const WHISPER_BIN = process.env.WHISPER_BIN || '/Users/padi/whisper.cpp/build/bin/whisper-cli';
const WHISPER_MODEL = process.env.WHISPER_MODEL || '/Users/padi/whisper.cpp/models/ggml-large-v3.bin';

export interface TranscriptionResult {
    text: string;
    language: string;
    segments: { start: number; end: number; text: string }[];
}

/**
 * Transcribe un archivo de video/audio con Whisper local.
 * Convierte a WAV primero con FFmpeg, luego transcribe.
 */
export async function transcribeVideo(videoPath: string): Promise<TranscriptionResult> {
    const tmpDir = os.tmpdir();
    const wavPath = path.join(tmpDir, `whisper_${Date.now()}.wav`);
    const jsonPath = wavPath.replace('.wav', '.json');

    try {
        // 1. Convertir video a WAV 16kHz mono (formato requerido por whisper)
        await execAsync(
            `ffmpeg -i "${videoPath}" -ar 16000 -ac 1 -c:a pcm_s16le "${wavPath}" -y 2>/dev/null`
        );

        // 2. Transcribir con Whisper local
        await execAsync(
            `"${WHISPER_BIN}" -m "${WHISPER_MODEL}" -f "${wavPath}" -oj -of "${wavPath.replace('.wav', '')}" --language auto 2>/dev/null`
        );

        // 3. Leer resultado JSON
        const result = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

        const segments = (result.transcription || []).map((s: any) => ({
            start: s.offsets?.from / 1000 || 0,
            end: s.offsets?.to / 1000 || 0,
            text: s.text?.trim() || '',
        }));

        const fullText = segments.map((s: any) => s.text).join(' ').trim();
        const language = result.result?.language || 'unknown';

        return { text: fullText, language, segments };

    } finally {
        // Limpiar archivos temporales
        [wavPath, jsonPath].forEach(f => {
            try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {}
        });
    }
}

/**
 * Elimina subtítulos hardcoded de un video con FFmpeg.
 */
export async function removeSubtitles(inputPath: string, outputPath: string): Promise<void> {
    // Elimina pistas de subtítulos y streams de texto
    await execAsync(
        `ffmpeg -i "${inputPath}" -map 0:v -map 0:a? -c copy -sn "${outputPath}" -y 2>/dev/null`
    );
}

/**
 * Limpia metadata de un archivo de video.
 */
export async function stripMetadata(inputPath: string, outputPath: string): Promise<void> {
    await execAsync(
        `ffmpeg -i "${inputPath}" -map_metadata -1 -c:v copy -c:a copy "${outputPath}" -y 2>/dev/null`
    );
}
