import { prisma } from '@/lib/prisma';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, rm, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';
import { uploadToProduct } from '@/lib/services/drive-service';

const execAsync = promisify(exec);

export interface BatchSubtitleResult {
    videoId: string;
    status: 'ok' | 'error' | 'skipped';
    error?: string;
    driveUrl?: string;
}

const PYTHON_BIN = process.env.PYTHON_BIN || 'python3';
const SUBTITLE_INJECTOR = join(process.cwd(), 'scripts', 'subtitle_injector.py');

/**
 * Process a single CompetitorVideo: generate SRT from scriptEs + timestamps,
 * call Python subtitle_injector.py, upload result to Drive, update DB.
 */
async function processOneVideo(
    video: any,
    concurrencySignal?: AbortSignal
): Promise<BatchSubtitleResult> {
    const tmpDir = join(tmpdir(), `sub-batch-${video.id}-${randomBytes(4).toString('hex')}`);
    await mkdir(tmpDir, { recursive: true });

    try {
        if (concurrencySignal?.aborted) {
            return { videoId: video.id, status: 'skipped', error: 'Aborted' };
        }

        // ── 1. Download source video ─────────────────────────────────────────
        const sourceUrl = video.driveUrl || video.sourceUrl || video.previewUrl;
        if (!sourceUrl) {
            return { videoId: video.id, status: 'skipped', error: 'No source URL' };
        }

        const videoPath = join(tmpDir, 'input.mp4');
        const res = await fetch(sourceUrl);
        if (!res.ok) throw new Error(`Download failed: ${res.status}`);
        await writeFile(videoPath, Buffer.from(await res.arrayBuffer()));

        // ── 2. Generate SRT from scriptEs ────────────────────────────────────
        // Use Whisper to get word-level timestamps for the Spanish script, or
        // generate a simple evenly-spaced SRT if no timestamps available.
        const srtPath = join(tmpDir, 'subtitles.srt');
        const script: string = video.scriptEs || '';

        if (!script.trim()) {
            return { videoId: video.id, status: 'skipped', error: 'No scriptEs' };
        }

        // Get video duration first
        const { stdout: durOut } = await execAsync(
            `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`
        );
        const duration = parseFloat(durOut.trim()) || 30;

        // Split script into chunks of ~8 words for subtitle lines
        const words = script.trim().split(/\s+/);
        const chunkSize = 8;
        const chunks: string[] = [];
        for (let i = 0; i < words.length; i += chunkSize) {
            chunks.push(words.slice(i, i + chunkSize).join(' '));
        }

        // Distribute evenly across video duration
        const chunkDur = duration / chunks.length;
        let srtContent = '';
        chunks.forEach((text, i) => {
            const startSec = i * chunkDur;
            const endSec = Math.min((i + 1) * chunkDur - 0.1, duration);
            srtContent += `${i + 1}\n${formatSrtTime(startSec)} --> ${formatSrtTime(endSec)}\n${text}\n\n`;
        });
        await writeFile(srtPath, srtContent);

        // ── 3. Call Python subtitle injector ────────────────────────────────
        const outPath = join(tmpDir, 'output.mp4');
        const jsonOut = join(tmpDir, 'region.json');

        const { stderr } = await execAsync(
            `${PYTHON_BIN} "${SUBTITLE_INJECTOR}" --video "${videoPath}" --srt "${srtPath}" --out "${outPath}" --json-out "${jsonOut}"`,
            { maxBuffer: 10 * 1024 * 1024 }
        );
        console.log(`[BatchSubs] ${video.id} python output:`, stderr.slice(-500));

        if (!(await fileExists(outPath))) {
            throw new Error('Python injector produced no output file');
        }

        // ── 4. Upload result to Drive ────────────────────────────────────────
        const outBuffer = await readFile(outPath);
        const filename = `SUB_ES_${video.filename || `video_${video.id}`}`;

        const driveResult = await uploadToProduct(
            outBuffer,
            filename.endsWith('.mp4') ? filename : `${filename}.mp4`,
            'video/mp4',
            video.productId,
            video.storeId,
            { fileType: 'TRANSLATED_VIDEO' }
        );

        const driveUrl = (driveResult as any)?.webViewLink || (driveResult as any)?.url || '';

        // ── 5. Update DB ─────────────────────────────────────────────────────
        await (prisma.competitorVideo as any).update({
            where: { id: video.id },
            data: {
                status: 'TRANSLATED',
                driveUrl: driveUrl || undefined,
                updatedAt: new Date(),
            }
        });

        console.log(`[BatchSubs] ✅ ${video.id} → ${driveUrl}`);
        return { videoId: video.id, status: 'ok', driveUrl };

    } catch (err: any) {
        console.error(`[BatchSubs] ❌ ${video.id}:`, err.message);
        await (prisma.competitorVideo as any).update({
            where: { id: video.id },
            data: { status: 'TRANSLATE_ERROR' }
        }).catch(() => {});
        return { videoId: video.id, status: 'error', error: err.message };
    } finally {
        await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
}

/**
 * Batch process all CompetitorVideos with scriptEs ready but not yet translated.
 * Runs up to `concurrency` videos in parallel.
 */
export async function runBatchSubtitleProcessor(options: {
    storeId?: string;
    limit?: number;
    concurrency?: number;
}): Promise<BatchSubtitleResult[]> {
    const { storeId, limit = 20, concurrency = 3 } = options;

    // Find videos ready for translation
    const where: any = {
        status: { in: ['VO_DONE', 'READY_TO_TRANSLATE', 'ANALYSED'] },
        scriptEs: { not: null },
    };
    if (storeId) where.storeId = storeId;

    const videos = await (prisma.competitorVideo as any).findMany({
        where,
        take: limit,
        orderBy: { createdAt: 'asc' },
        select: {
            id: true, storeId: true, productId: true,
            filename: true, sourceUrl: true, previewUrl: true,
            driveUrl: true, scriptEs: true, status: true
        }
    });

    console.log(`[BatchSubs] Found ${videos.length} videos to process (limit=${limit})`);
    if (videos.length === 0) return [];

    // Process in batches of `concurrency` in parallel
    const results: BatchSubtitleResult[] = [];
    for (let i = 0; i < videos.length; i += concurrency) {
        const batch = videos.slice(i, i + concurrency);
        const batchResults = await Promise.all(batch.map((v: any) => processOneVideo(v)));
        results.push(...batchResults);
        console.log(`[BatchSubs] Batch ${Math.floor(i / concurrency) + 1} done:`, batchResults.map(r => r.status));
    }

    return results;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatSrtTime(sec: number): string {
    const ms = Math.floor((sec % 1) * 1000);
    const s = Math.floor(sec) % 60;
    const m = Math.floor(sec / 60) % 60;
    const h = Math.floor(sec / 3600);
    return `${pad(h)}:${pad(m)}:${pad(s)},${String(ms).padStart(3, '0')}`;
}

function pad(n: number): string { return String(n).padStart(2, '0'); }

async function fileExists(path: string): Promise<boolean> {
    try { await readFile(path); return true; } catch { return false; }
}
