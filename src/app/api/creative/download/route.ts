/**
 * GET /api/creative/download?assetId=xxx&storeId=xxx
 * Descarga directa de un creativo desde Google Drive, sirviendo el stream al cliente.
 * Permite descargar vídeos sin abrir Google Drive.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const assetId = searchParams.get('assetId');
        const storeId = searchParams.get('storeId');

        if (!assetId || !storeId) {
            return NextResponse.json({ error: 'assetId y storeId son requeridos' }, { status: 400 });
        }

        // Buscar asset
        const asset = await (prisma as any).creativeAsset.findUnique({
            where: { id: assetId },
            select: { id: true, name: true, nomenclatura: true, driveFileId: true, type: true, storeId: true }
        });

        if (!asset) {
            return NextResponse.json({ error: 'Asset no encontrado' }, { status: 404 });
        }

        if (!asset.driveFileId) {
            return NextResponse.json({ error: 'Este asset no tiene archivo en Drive' }, { status: 400 });
        }

        // Autenticar con Google
        const { google } = await import('googleapis');
        const { getConnectionSecret } = await import('@/lib/server/connections');
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

        // Obtener el stream del archivo desde Drive
        const driveRes = await drive.files.get(
            { fileId: asset.driveFileId, alt: 'media', supportsAllDrives: true },
            { responseType: 'stream' }
        );

        // Determinar tipo MIME
        const mimeType = asset.type === 'VIDEO' ? 'video/mp4' : 'application/octet-stream';
        const fileName = (asset.nomenclatura || asset.name || 'video').replace(/[^a-zA-Z0-9._-]/g, '_');

        // Convertir el stream de google-api a ReadableStream de Web API
        const { Readable } = await import('stream');
        const nodeStream = driveRes.data as any;

        const webStream = new ReadableStream({
            start(controller) {
                nodeStream.on('data', (chunk: Buffer) => controller.enqueue(chunk));
                nodeStream.on('end', () => controller.close());
                nodeStream.on('error', (err: Error) => controller.error(err));
            }
        });

        return new NextResponse(webStream, {
            headers: {
                'Content-Type': mimeType,
                'Content-Disposition': `attachment; filename="${fileName}.mp4"`,
                'Cache-Control': 'no-cache',
            }
        });

    } catch (err: any) {
        console.error('[Download] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
