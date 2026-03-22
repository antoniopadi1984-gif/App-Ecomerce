/**
 * GET /api/drive/thumbnail?fileId=xxx&storeId=xxx
 * Genera miniatura del vídeo usando ffmpeg con pipe desde Drive.
 * Evita el problema del moov atom al final del MP4 usando spawn+stdin.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getConnectionSecret } from '@/lib/server/connections';
import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

const FFMPEG = process.env.FFMPEG_PATH || '/opt/homebrew/bin/ffmpeg';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');
    const storeId = searchParams.get('storeId') || 'store-main';

    if (!fileId) return new NextResponse('Missing fileId', { status: 400 });

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'thumb-'));
    const thumbPath = path.join(tmpDir, 'thumb.jpg');

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

        // 1. Intentar thumbnailLink nativo de Drive (funciona para docs/imágenes, no para MP4 privados)
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
                        headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400' }
                    });
                }
            }
        } catch {}

        // 2. Descargar el archivo completo (hasta 80MB) y guardar localmente para que ffmpeg pueda leer el moov atom
        const videoPath = path.join(tmpDir, 'video.mp4');
        const driveRes = await drive.files.get(
            { fileId, alt: 'media', supportsAllDrives: true },
            { responseType: 'stream', headers: { Range: 'bytes=0-83886080' } }
        );

        await new Promise<void>((resolve) => {
            const ws = require('fs').createWriteStream(videoPath);
            const stream = driveRes.data as any;
            stream.pipe(ws);
            ws.on('finish', resolve);
            ws.on('error', resolve);
            stream.on('error', resolve); // 206 partial puede cerrar con error
        });

        // Intentar extraer frame con el archivo descargado
        const ffmpegExtract = (seek: string) => new Promise<boolean>((resolve) => {
            const proc = spawn(FFMPEG, [
                '-y',
                '-i', videoPath,
                ...(seek ? ['-ss', seek] : []),
                '-frames:v', '1',
                '-q:v', '3',
                '-f', 'image2',
                thumbPath
            ]);
            proc.on('close', (code) => resolve(code === 0));
        });

        const ok = await ffmpegExtract('0:00:01') || await ffmpegExtract('');

        if (ok) {
            const thumbData = await fs.readFile(thumbPath).catch(() => null);
            if (thumbData) {
                return new NextResponse(thumbData, {
                    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400' }
                });
            }
        }

        return new NextResponse('No thumbnail', { status: 404 });

    } catch (error: any) {
        console.error('[DriveThumbnail] Error:', error.message?.slice(0, 200));
        return new NextResponse('No thumbnail', { status: 404 });
    } finally {
        await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
}
