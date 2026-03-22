/**
 * GET /api/drive/thumbnail?fileId=xxx&storeId=xxx
 * Genera miniatura extrayendo el frame 1s del video con ffmpeg.
 * Drive no genera thumbnailLink para MP4 en Shared Drives privados.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getConnectionSecret } from '@/lib/server/connections';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

const execAsync = promisify(exec);
const FFMPEG = process.env.FFMPEG_PATH || '/opt/homebrew/bin/ffmpeg';
const FFPROBE = '/opt/homebrew/bin/ffprobe';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');
    // storeId puede venir como param o usar store-main como fallback
    const storeId = searchParams.get('storeId') || 'store-main';

    if (!fileId) return new NextResponse('Missing fileId', { status: 400 });

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'thumb-'));
    try {
        // Auth con Google Drive
        const { google } = await import('googleapis');
        const saKey = await getConnectionSecret(storeId, 'GOOGLE_CLOUD')
            || process.env.GOOGLE_SERVICE_ACCOUNT_KEY
            || null;
        if (!saKey) return new NextResponse('Drive no configurado', { status: 400 });

        const driveAuth = new google.auth.GoogleAuth({
            credentials: JSON.parse(saKey),
            scopes: ['https://www.googleapis.com/auth/drive.readonly']
        });
        const drive = google.drive({ version: 'v3', auth: driveAuth });

        // Intentar primero el thumbnailLink nativo de Drive (rápido para imágenes/docs)
        try {
            const meta = await drive.files.get({
                fileId,
                fields: 'thumbnailLink,mimeType',
                supportsAllDrives: true
            });
            if (meta.data.thumbnailLink) {
                const imgRes = await fetch(meta.data.thumbnailLink.replace('=s220', '=s400'));
                if (imgRes.ok) {
                    const buf = await imgRes.arrayBuffer();
                    return new NextResponse(buf, {
                        headers: {
                            'Content-Type': 'image/jpeg',
                            'Cache-Control': 'public, max-age=86400',
                        }
                    });
                }
            }
        } catch {}

        // Fallback: descargar primero 5 segundos del video con Range y extraer frame
        const videoPath = path.join(tmpDir, 'segment.mp4');
        const thumbPath = path.join(tmpDir, 'thumb.jpg');

        // Descargar solo los primeros ~2MB para obtener el frame inicial
        const driveRes = await drive.files.get(
            { fileId, alt: 'media', supportsAllDrives: true },
            { responseType: 'stream', headers: { Range: 'bytes=0-2097152' } }
        );

        await new Promise<void>((resolve, reject) => {
            const ws = require('fs').createWriteStream(videoPath);
            (driveRes.data as any).pipe(ws);
            ws.on('finish', resolve);
            ws.on('error', reject);
            (driveRes.data as any).on('error', resolve); // 206 puede cerrar con error
        });

        // Extraer frame al segundo 1 (o al principio si el video es muy corto)
        await execAsync(
            `${FFMPEG} -i '${videoPath}' -ss 00:00:01 -frames:v 1 -q:v 3 '${thumbPath}' -y 2>/dev/null`
        ).catch(() =>
            execAsync(`${FFMPEG} -i '${videoPath}' -frames:v 1 -q:v 3 '${thumbPath}' -y 2>/dev/null`)
        );

        const thumbData = await fs.readFile(thumbPath);
        return new NextResponse(thumbData, {
            headers: {
                'Content-Type': 'image/jpeg',
                'Cache-Control': 'public, max-age=86400',
            }
        });

    } catch (error: any) {
        console.error('[DriveThumbnail] Error:', error.message?.slice(0, 200));
        return new NextResponse('No thumbnail', { status: 404 });
    } finally {
        await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
}
