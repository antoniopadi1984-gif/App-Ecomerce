/**
 * POST /api/video-lab/sync-drive
 * Verifica qué archivos de la BD ya no existen en Drive y los elimina.
 * Body: { storeId, productId? }
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getConnectionSecret } from '@/lib/server/connections';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
    try {
        const { storeId, productId } = await req.json();
        if (!storeId) return NextResponse.json({ error: 'storeId requerido' }, { status: 400 });

        // Auth Drive
        const { google } = await import('googleapis');
        const saKey = await getConnectionSecret(storeId, 'GOOGLE_CLOUD')
            || process.env.GOOGLE_SERVICE_ACCOUNT_KEY
            || null;
        if (!saKey) return NextResponse.json({ error: 'Google Drive no configurado' }, { status: 400 });

        const driveAuth = new google.auth.GoogleAuth({
            credentials: JSON.parse(saKey),
            scopes: ['https://www.googleapis.com/auth/drive.readonly']
        });
        const drive = google.drive({ version: 'v3', auth: driveAuth });

        // Buscar todos los assets con driveFileId
        const where: any = { storeId, NOT: { driveFileId: null } };
        if (productId) where.productId = productId;

        const assets = await (prisma as any).creativeAsset.findMany({
            where,
            select: { id: true, driveFileId: true, name: true }
        });

        console.log(`[SyncDrive] Verificando ${assets.length} assets en Drive...`);

        const orphaned: string[] = [];
        const existing: string[] = [];

        // Verificar en lotes de 20 para no superar cuota
        for (const asset of assets) {
            try {
                await drive.files.get({
                    fileId: asset.driveFileId,
                    fields: 'id,trashed',
                    supportsAllDrives: true
                });
                existing.push(asset.id);
            } catch (e: any) {
                // 404 o permiso denegado = ya no existe o está en papelera
                if (e.code === 404 || e.status === 404 || (e.message && e.message.includes('404'))) {
                    orphaned.push(asset.id);
                    console.log(`[SyncDrive] Huérfano detectado: ${asset.name} (${asset.driveFileId})`);
                }
            }
        }

        // Eliminar huérfanos de la BD
        if (orphaned.length > 0) {
            await (prisma as any).creativeAsset.deleteMany({
                where: { id: { in: orphaned } }
            });
            console.log(`[SyncDrive] ✅ ${orphaned.length} assets huérfanos eliminados`);
        }

        return NextResponse.json({
            success: true,
            total: assets.length,
            existing: existing.length,
            removed: orphaned.length,
            removedIds: orphaned
        });

    } catch (err: any) {
        console.error('[SyncDrive] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
