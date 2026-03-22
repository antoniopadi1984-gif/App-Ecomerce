/**
 * GET /api/creative/stream?assetId=xxx&storeId=xxx
 * Stream proxy para reproducción de vídeo directo en el navegador.
 * Soporta Range requests (necesario para <video> en Chrome/Safari).
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getConnectionSecret } from '@/lib/server/connections';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const assetId = searchParams.get('assetId');
        const storeId = searchParams.get('storeId');

        if (!assetId || !storeId) {
            return NextResponse.json({ error: 'assetId and storeId required' }, { status: 400 });
        }

        // Buscar asset en BD
        const asset = await (prisma as any).creativeAsset.findUnique({
            where: { id: assetId },
            select: { id: true, name: true, nomenclatura: true, driveFileId: true, type: true }
        });
        if (!asset?.driveFileId) {
            return NextResponse.json({ error: 'Asset sin driveFileId' }, { status: 404 });
        }

        // Auth con Google Drive
        const { google } = await import('googleapis');
        const saKey = await getConnectionSecret(storeId, 'GOOGLE_CLOUD')
            || process.env.GOOGLE_SERVICE_ACCOUNT_KEY
            || null;
        if (!saKey) {
            return NextResponse.json({ error: 'Google Drive no configurado' }, { status: 400 });
        }
        const driveAuth = new google.auth.GoogleAuth({
            credentials: JSON.parse(saKey),
            scopes: ['https://www.googleapis.com/auth/drive.readonly']
        });
        const drive = google.drive({ version: 'v3', auth: driveAuth });

        // Obtener metadata del archivo (tamaño para Range)
        let fileSize = 0;
        try {
            const meta = await drive.files.get({
                fileId: asset.driveFileId,
                fields: 'size',
                supportsAllDrives: true
            });
            fileSize = parseInt((meta.data as any).size || '0');
        } catch {}

        // Leer Range header del navegador
        const rangeHeader = req.headers.get('range');
        let start = 0;
        let end = fileSize > 0 ? fileSize - 1 : 0;

        if (rangeHeader && fileSize > 0) {
            const [, rangeStr] = rangeHeader.split('=');
            const [startStr, endStr] = rangeStr.split('-');
            start = parseInt(startStr) || 0;
            end = endStr ? parseInt(endStr) : fileSize - 1;
        }

        // Obtener stream de Drive con Range
        const headers: Record<string, string> = {};
        if (rangeHeader && fileSize > 0) {
            headers['Range'] = `bytes=${start}-${end}`;
        }

        const driveRes = await drive.files.get(
            { fileId: asset.driveFileId, alt: 'media', supportsAllDrives: true },
            { responseType: 'stream', headers }
        );

        const nodeStream = driveRes.data as any;
        const webStream = new ReadableStream({
            start(controller) {
                nodeStream.on('data', (chunk: Buffer) => controller.enqueue(chunk));
                nodeStream.on('end', () => controller.close());
                nodeStream.on('error', (err: Error) => controller.error(err));
            },
            cancel() {
                nodeStream.destroy?.();
            }
        });

        const responseHeaders: Record<string, string> = {
            'Content-Type': 'video/mp4',
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'no-store',
        };

        if (fileSize > 0) {
            responseHeaders['Content-Length'] = String(end - start + 1);
            responseHeaders['Content-Range'] = `bytes ${start}-${end}/${fileSize}`;
        }

        return new NextResponse(webStream, {
            status: rangeHeader && fileSize > 0 ? 206 : 200,
            headers: responseHeaders
        });

    } catch (err: any) {
        console.error('[Stream] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
