import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const maxDuration = 120;
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, storeId, productId, sku, competitors } = body;

        if (action !== 'create_structure' || !storeId || !productId) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const skuIdentifier = sku || `PROD_${product.title.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_01`.substring(0, 20);

        // 1. Generate structure
        const foldersToCreate = [
            `00_INBOX/VIDEOS`,
            `00_INBOX/IMAGENES`,
            `00_INBOX/LANDINGS`,
            `00_INBOX/SPY`,
            `00_INBOX/OTROS`,

            `01_RESEARCH/CORE`,
            `01_RESEARCH/AVATARES`,
            `01_RESEARCH/ANGULOS`,
            `01_RESEARCH/COMBOS`,
            `01_RESEARCH/VECTORES`,

            `03_CONCEPTOS`,

            `04_PRODUCCION/TOF/UGC`,
            `04_PRODUCCION/TOF/FACECAM`,
            `04_PRODUCCION/MOF/DEMO`,
            `04_PRODUCCION/BOF/STATIC`,
            `04_PRODUCCION/RETARGETING/STATIC`,

            `05_LANDINGS/VSL`,
            `05_LANDINGS/ADVERTORIAL`,
            `05_LANDINGS/LISTICLE`,
            `05_LANDINGS/PRODUCT_PAGE`,

            `06_AVATARES_IA/FACE_MODELS`,
            `06_AVATARES_IA/VOICE_PROFILES`,
            `06_AVATARES_IA/RENDERS`,

            `07_BIBLIOTECA/GANADORES`,
            `07_BIBLIOTECA/EN_TEST`,
            `07_BIBLIOTECA/ARCHIVADOS`,
        ];

        // Competitors directories
        if (competitors && Array.isArray(competitors)) {
            competitors.forEach((comp: any) => {
                const compName = (comp.name || comp.url || 'UNKNOWN').substring(0, 15).toUpperCase().replace(/[^A-Z0-9]/g, '_');
                foldersToCreate.push(
                    `02_SPY/${compName}/ADS`,
                    `02_SPY/${compName}/IMAGES`,
                    `02_SPY/${compName}/LANDINGS`,
                    `02_SPY/${compName}/WEBM`
                );
            });
        }

        // Crear estructura real en Google Drive y persistir folder IDs en BD
        const { setupProductDrive } = await import('@/lib/services/drive-service');
        const realFolderId = await setupProductDrive(productId, storeId);

        // setupProductDrive ya crea los driveFolder records en BD internamente
        // Registrar el folder raíz si no existe aún
        if (realFolderId) {
            try {
                await prisma.driveFolder.create({
                    data: { storeId, productId, path: 'ROOT', driveFolderId: realFolderId }
                });
            } catch { /* ya existe — ignorar */ }
        }

        // 2. Trigger auto-import for Competitors with Meta/TikTok URLs
        const origin = req.headers.get('origin') || 'http://localhost:3000';
        if (competitors && Array.isArray(competitors)) {
            for (const comp of competitors) {
                if (comp.urlMetaLibrary || comp.urlTikTokLibrary) {
                    const source = comp.urlMetaLibrary ? 'meta' : 'tiktok';
                    fetch(`${origin}/api/spy/import`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            productId,
                            competitor: comp.name || comp.url,
                            source,
                            url: comp.urlMetaLibrary || comp.urlTikTokLibrary
                        })
                    }).catch(e => console.error('[organize] Auto-import error:', e));
                }
            }
        }

        return NextResponse.json({ success: true, message: `Created ${foldersToCreate.length} folders successfully.` });

    } catch (e: unknown) {
        console.error('[API /drive/organize]', e);
        return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
    }
}
