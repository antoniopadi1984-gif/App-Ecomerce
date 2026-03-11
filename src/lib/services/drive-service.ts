/**
 * ─── Drive Service — EcomBom Creativo ───────────────────────────────────────
 * Servicio central para toda la interacción con Google Drive.
 * Gestiona la estructura IA Pro automáticamente.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { prisma } from '@/lib/prisma';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface DriveFolder { id: string; name: string; path: string; }
export interface DriveFileEntry { id: string; name: string; mimeType: string; size?: number; path: string; thumbnailUrl?: string; }

export interface ProductIndex {
    productId: string;
    storeId: string;
    updatedAt: string;
    concepts: ConceptEntry[];
    research: { exists: boolean; files: string[] };
    landings: { exists: boolean; count: number };
    assets: { images: number; videos: number };
}
export interface ConceptEntry {
    id: string; // C01, C02...
    name: string;
    angleId?: string;
    avatarId?: string;
    status: 'TESTING' | 'WINNER' | 'LOSER' | 'PAUSED' | 'DRAFT';
    videos: VideoEntry[];
    performance: { spend: number; revenue: number; roas: number };
}
export interface VideoEntry {
    id: string;
    file: string;
    driveId: string;
    funnelStage: string;
    type: string;
    hook?: string;
    transcription?: string;
    clips?: string[];
    metrics?: { ctr?: number; roas?: number; cpa?: number; hookRate?: number; status?: string };
}

// ── In-memory cache ───────────────────────────────────────────────────────────
const indexCache = new Map<string, { data: ProductIndex; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function invalidateStoreCache(storeId: string) {
  for (const [key] of indexCache.entries()) {
    if (key.startsWith(storeId)) {
      indexCache.delete(key);
    }
  }
}

import { NomenclatureService } from './nomenclature-service';

// ── Folder path builders ──────────────────────────────────────────────────────
export const DrivePaths = {
    root: (storeId: string) => `ECOMBOOM/${storeId}`,
    product: (storeId: string, sku: string) => `ECOMBOOM/${storeId}/${sku}`,
    concept: (storeId: string, sku: string, cNum: number, cName: string) =>
        `ECOMBOOM/${storeId}/${sku}/C${cNum}_${cName.replace(/\s+/g, '')}`,
    version: (storeId: string, sku: string, cNum: number, cName: string, version: string) =>
        `ECOMBOOM/${storeId}/${sku}/C${cNum}_${cName.replace(/\s+/g, '')}/${version}`,
    research: (storeId: string, sku: string) => `ECOMBOOM/${storeId}/${sku}/01_RESEARCH`,
    landings: (storeId: string, sku: string) => `ECOMBOOM/${storeId}/${sku}/04_LANDINGS`,
    assets: (storeId: string, sku: string) => `ECOMBOOM/${storeId}/${sku}/06_ASSETS`,
    index: (storeId: string, sku: string) => `ECOMBOOM/${storeId}/${sku}/index.json`,
};

// ── Google Drive API wrapper ───────────────────────────────────────────────────
export async function getDriveClient() {
    // Build auth from GCP credentials
    const { google } = await import('googleapis');
    const auth = new google.auth.GoogleAuth({
        credentials: process.env.GOOGLE_SERVICE_ACCOUNT_KEY ?
            JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY) : undefined,
        keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        scopes: [
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/drive.file',
        ],
    });
    return google.drive({ version: 'v3', auth });
}

export async function findOrCreateFolder(drive: any, name: string, parentId?: string): Promise<string> {
    const q = [`name = '${name}'`, `mimeType = 'application/vnd.google-apps.folder'`, `trashed = false`];
    if (parentId) q.push(`'${parentId}' in parents`);

    const res = await drive.files.list({ 
        q: q.join(' and '), fields: 'files(id,name)', pageSize: 5,
        supportsAllDrives: true, includeItemsFromAllDrives: true
    });
    if (res.data.files?.length > 0) return res.data.files[0].id;

    if (!parentId) {
        // CRITICAL: Floating files/folders in Service Accounts have 0 quota.
        // We MUST force them into the Root ID if no parent is provided.
        parentId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || '1-3S_uYhq3mEBbtPNwNP3gXSLCN-yEmp8';
        console.warn(`[DriveService] findOrCreateFolder('${name}') mandatory parent fallback to: ${parentId}`);
    }

    const created = await drive.files.create({
        requestBody: { 
            name, 
            mimeType: 'application/vnd.google-apps.folder', 
            parents: [parentId] 
        },
        fields: 'id',
        supportsAllDrives: true
    });
    return created.data.id!;
}

// ── Setup functions ───────────────────────────────────────────────────────────
/**
 * Creates the full Drive folder structure for a store.
 * Saves the root folder ID to Store.driveFolderId.
 */
export async function setupStoreDrive(storeId: string): Promise<string> {
    try {
        const drive = await getDriveClient();

        // Root: ECOMBOOM/
        const ROOT_ID = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || '1-3S_uYhq3mEBbtPNwNP3gXSLCN-yEmp8';
        console.log(`[DriveService] Absolute Root ID: ${ROOT_ID}`);
        
        // We assume the ROOT_ID provided IS the ECOMBOOM folder or its parent.
        // To be safe, we always use ROOT_ID as the parent for the Store folder.
        const store = await (prisma as any).store.findUnique({ where: { id: storeId }, select: { name: true } });
        const storeName = store?.name?.replace(/\s+/g, '_').toUpperCase() ?? storeId;
        
        // Use ROOT_ID as the container. We don't need a middle ECOMBOOM folder if it causes Quota issues.
        const storeFolderId = await findOrCreateFolder(drive, storeName, ROOT_ID);
        
        // Config folder
        await findOrCreateFolder(drive, '_CONFIG', storeFolderId);

        await (prisma as any).store.update({
            where: { id: storeId },
            data: { driveRootFolderId: storeFolderId, driveSetupDone: true }
        });

        return storeFolderId;
    } catch (e) {
        console.error('[DriveService] setupStoreDrive failed:', e);
        throw e;
    }
}

/**
 * Creates the full Drive folder structure for a product.
 * Returns the product root folder ID.
 */
export async function setupProductDrive(productId: string, storeId: string): Promise<string> {
    try {
        const drive = await getDriveClient();

        const store = await (prisma as any).store.findUnique({
            where: { id: storeId },
            select: { driveRootFolderId: true, name: true }
        });
        const product = await (prisma as any).product.findUnique({
            where: { id: productId },
            select: { title: true, sku: true }
        });

        let storeFolderId = store?.driveRootFolderId;
        if (!storeFolderId) storeFolderId = await setupStoreDrive(storeId);

        const prodSku = NomenclatureService.extractSku(product?.title ?? productId, product?.sku);
        const prodFolderId = await findOrCreateFolder(drive, prodSku, storeFolderId);

        // --- NEW IA PRO STRUCTURE ---
        const centroId = await findOrCreateFolder(drive, "CENTRO_CREATIVO", prodFolderId);

        // 00_INBOX
        await findOrCreateFolder(drive, "00_INBOX_SIN_PROCESAR", centroId);

        // 01_ESTUDIO
        const estudioId = await findOrCreateFolder(drive, "01_ESTUDIO_PRODUCCION", centroId);
        await findOrCreateFolder(drive, "01_IA_VILLAGES", estudioId);
        await findOrCreateFolder(drive, "02_AUDIO", estudioId);
        await findOrCreateFolder(drive, "03_RAW", estudioId);
        await findOrCreateFolder(drive, "04_PROYECTOS", estudioId);

        // 02_BIBLIOTECA
        const biblioId = await findOrCreateFolder(drive, "02_BIBLIOTECA_LISTOS_PARA_ADS", centroId);

        // Retargeting subfolders
        const retargetId = await findOrCreateFolder(drive, "01_RETARGETING", biblioId);
        await findOrCreateFolder(drive, "R10_COPY_DIRECTO", retargetId);
        await findOrCreateFolder(drive, "R20_COPY_PROBLEMA", retargetId);
        await findOrCreateFolder(drive, "R30_COPY_STORY", retargetId);

        await findOrCreateFolder(drive, "02_CONCEPTOS", biblioId);
        await findOrCreateFolder(drive, "03_ESTATICOS", biblioId);

        // 05_LANDINGS
        await findOrCreateFolder(drive, "05_LANDINGS", centroId);

        // 06_ASSETS
        const assetsId = await findOrCreateFolder(drive, "06_ASSETS", centroId);
        await findOrCreateFolder(drive, "IMAGENES_LANDING", assetsId);
        await findOrCreateFolder(drive, "TEMA_SHOPIFY", assetsId);
        // --- END IA PRO STRUCTURE ---

        // Create empty index.json
        const emptyIndex: ProductIndex = {
            productId, storeId,
            updatedAt: new Date().toISOString(),
            concepts: [],
            research: { exists: false, files: [] },
            landings: { exists: false, count: 0 },
            assets: { images: 0, videos: 0 },
        };
        await drive.files.create({
            requestBody: {
                name: 'index.json',
                mimeType: 'application/json',
                parents: [prodFolderId],
            },
            media: {
                mimeType: 'application/json',
                body: JSON.stringify(emptyIndex, null, 2),
            },
            fields: 'id',
            supportsAllDrives: true
        });

        await (prisma as any).product.update({
            where: { id: productId },
            data: {
                driveFolderId: prodFolderId,
                driveSetupDone: true,
                driveIndexPath: `${prodSku}/index.json`,
            }
        });

        return prodFolderId;
    } catch (e) {
        console.error('[DriveService] setupProductDrive failed:', e);
        throw e;
    }
}

// ── Index management ──────────────────────────────────────────────────────────
export async function syncProductIndex(productId: string, storeId: string) {
    try {
        const drive = await getDriveClient();
        const product = await (prisma as any).product.findUnique({
            where: { id: productId },
            include: {
                concepts: {
                    include: {
                        creatives: true
                    }
                },
                creativeArtifacts: true,
                researchRuns: true
            }
        });

        if (!product || !product.driveFolderId) return null;

        const indexData: ProductIndex = {
            productId,
            storeId,
            updatedAt: new Date().toISOString(),
            concepts: product.concepts.map((c: any) => ({
                id: `C${String(c.number).padStart(2, '0')}`,
                name: c.name,
                status: c.status,
                videos: c.creatives.map((v: any) => ({
                    id: v.id,
                    file: v.fileName,
                    driveId: v.driveFileId,
                    funnelStage: v.funnelStage || 'TOF',
                    type: v.fileType || 'VIDEO'
                })),
                performance: {
                    spend: c.spend || 0,
                    revenue: c.revenue || 0,
                    roas: c.roas || 0
                }
            })),
            research: {
                exists: product.researchRuns.length > 0,
                files: []
            },
            landings: {
                exists: product.landingUrl != null,
                count: 0
            },
            assets: {
                images: product.creativeArtifacts.filter((a: any) => a.type === 'STATIC').length,
                videos: product.creativeArtifacts.filter((a: any) => a.type === 'VIDEO').length
            }
        };

        // Find index.json
        const res = await drive.files.list({
            q: `name = 'index.json' and '${product.driveFolderId}' in parents and trashed = false`,
            fields: 'files(id)',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        });

        if (res.data.files && res.data.files.length > 0) {
            const fileId = res.data.files[0].id;
            if (fileId) {
                await drive.files.update({
                    fileId,
                    media: {
                        mimeType: 'application/json',
                        body: JSON.stringify(indexData, null, 2),
                    },
                    supportsAllDrives: true
                });
            }
        } else {
            await drive.files.create({
                requestBody: {
                    name: 'index.json',
                    mimeType: 'application/json',
                    parents: [product.driveFolderId],
                },
                media: {
                    mimeType: 'application/json',
                    body: JSON.stringify(indexData, null, 2),
                },
                supportsAllDrives: true
            });
        }

        invalidateProductIndex(productId);
        return indexData;
    } catch (e) {
        console.warn('[DriveService] syncProductIndex failed:', e);
        return null;
    }
}

export async function getProductIndex(productId: string, storeId: string): Promise<ProductIndex | null> {
    const cached = indexCache.get(productId);
    if (cached && cached.expires > Date.now()) return cached.data;

    try {
        const drive = await getDriveClient();
        const product = await (prisma as any).product.findUnique({
            where: { id: productId },
            select: { driveFolderId: true }
        });

        if (!product?.driveFolderId) return null;

        // Find index.json in product folder
        const res = await drive.files.list({
            q: `name = 'index.json' and '${product.driveFolderId}' in parents and trashed = false`,
            fields: 'files(id)',
            pageSize: 1,
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        });

        if (!res.data.files || res.data.files.length === 0) return null;
        const fileId = res.data.files[0].id;
        if (!fileId) return null;

        const fileRes = await (drive.files.get as any)({ fileId, alt: 'media' });
        const data = JSON.parse(typeof fileRes.data === 'string' ? fileRes.data : JSON.stringify(fileRes.data)) as ProductIndex;

        indexCache.set(productId, { data, expires: Date.now() + CACHE_TTL });
        return data;
    } catch (e) {
        console.warn('[DriveService] getProductIndex failed:', e);
        return null;
    }
}

export function invalidateProductIndex(productId: string) {
    indexCache.delete(productId);
}

// ── List files in a product folder ────────────────────────────────────────────
export async function listProductFolder(
    productId: string,
    subPath?: string
): Promise<DriveFileEntry[]> {
    try {
        const drive = await getDriveClient();
        const product = await (prisma as any).product.findUnique({
            where: { id: productId },
            select: { driveFolderId: true }
        });
        if (!product?.driveFolderId) return [];

        let parentId = product.driveFolderId;

        // Navigate to subPath if specified
        if (subPath) {
            const parts = subPath.split('/');
            for (const part of parts) {
                const res = await drive.files.list({
                    q: `name = '${part}' and '${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
                    fields: 'files(id)',
                    pageSize: 1,
                    supportsAllDrives: true,
                    includeItemsFromAllDrives: true
                });
                if (!res.data.files?.length) return [];
                parentId = res.data.files[0].id;
            }
        }

        const res = await drive.files.list({
            q: `'${parentId}' in parents and trashed = false`,
            fields: 'files(id,name,mimeType,size,thumbnailLink,webViewLink)',
            pageSize: 100,
            orderBy: 'name',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        });

        return (res.data.files ?? []).map((f: any) => ({
            id: f.id,
            name: f.name,
            mimeType: f.mimeType,
            size: f.size ? parseInt(f.size) : undefined,
            path: subPath ? `${subPath}/${f.name}` : f.name,
            thumbnailUrl: f.thumbnailLink,
        }));
    } catch (e) {
        console.warn('[DriveService] listProductFolder failed:', e);
        return [];
    }
}

// ── Upload file to correct folder ─────────────────────────────────────────────
export async function uploadToProduct(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    productId: string,
    storeId: string,
    opts: { conceptCode?: string; funnelStage?: string; fileType?: string; creativeArtifactId?: string }
): Promise<{ driveFileId: string; drivePath: string; driveUrl: string }> {
    const drive = await getDriveClient();
    const product = await (prisma as any).product.findUnique({
        where: { id: productId },
        select: { driveFolderId: true, title: true }
    });

    let folderId = product?.driveFolderId;
    if (!folderId) folderId = await setupProductDrive(productId, storeId);

    // Determine target subfolder based on Nomenclature structure
    let subFolder = folderId;

    if (opts.creativeArtifactId) {
        // Find artifacts to get its nomenclature logic
        const artifact = await (prisma as any).creativeArtifact.findUnique({
            where: { id: opts.creativeArtifactId },
            include: { concept: true }
        });

        if (artifact) {
            const cNum = artifact.concept.number || 1;
            const cName = artifact.concept.name.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
            const conceptFolderName = `C${cNum}_${cName}`;
            const versionFolderName = `V${artifact.version}${artifact.variantSuffix || ''}`;

            const conceptFolderId = await findOrCreateFolder(drive, conceptFolderName, folderId);
            subFolder = await findOrCreateFolder(drive, versionFolderName, conceptFolderId);
        }
    } else if (opts.fileType === 'IMAGE') {
        const assetsFolder = await findOrCreateFolder(drive, '06_ASSETS', folderId);
        subFolder = await findOrCreateFolder(drive, 'IMAGENES', assetsFolder);
    }

    const res = await drive.files.create({
        requestBody: { name: fileName, parents: [subFolder] },
        media: { mimeType, body: require('stream').Readable.from(fileBuffer) },
        fields: 'id,name,webViewLink,webContentLink',
        supportsAllDrives: true
    });

    const driveFileId = res.data.id!;
    const driveUrl = res.data.webContentLink; // URL de descarga directa
    const drivePath = `${opts.conceptCode ?? ''}/${opts.funnelStage ?? ''}/${fileName}`;

    // Save to DriveFile DB table
    await (prisma as any).driveFile.upsert({
        where: { driveFileId },
        create: {
            storeId, productId, driveFileId, drivePath, fileName,
            conceptCode: opts.conceptCode,
            funnelStage: opts.funnelStage,
            fileType: opts.fileType ?? 'VIDEO',
            mimeType,
            nomenclature: fileName // Usamos el nombre del archivo como nomenclatura por defecto si no hay otro
        },
        update: { syncedAt: new Date(), drivePath },
    });

    // Link to CreativeArtifact if ID provided
    if (opts.creativeArtifactId) {
        await (prisma as any).creativeArtifact.update({
            where: { id: opts.creativeArtifactId },
            data: {
                driveFileId,
                driveUrl: driveUrl || '',
            }
        });
    }

    invalidateProductIndex(productId);
    await syncProductIndex(productId, storeId);
    return { driveFileId, drivePath, driveUrl: driveUrl || '' };
}

export async function downloadFile(fileId: string): Promise<Buffer> {
    const drive = await getDriveClient();
    const res = await drive.files.get({ fileId, alt: 'media', supportsAllDrives: true }, { responseType: 'arraybuffer' });
    return Buffer.from(res.data as ArrayBuffer);
}

/**
 * ── Inbox Processing ────────────────────────────────────────────────────────
 * Moves files from 00_INBOX to studies (03_RAW/02_AUDIO) with nomenclature.
 */
export async function processInbox(productId: string, storeId: string) {
    try {
        const drive = await getDriveClient();
        const product = await (prisma as any).product.findUnique({
            where: { id: productId },
            select: { driveFolderId: true, sku: true, vendor: true }
        });

        if (!product?.driveFolderId) return { success: false, error: "Drive not setup" };

        const centroId = await findOrCreateFolder(drive, "CENTRO_CREATIVO", product.driveFolderId);
        const inboxId = await findOrCreateFolder(drive, "00_INBOX_SIN_PROCESAR", centroId);
        const estudioId = await findOrCreateFolder(drive, "01_ESTUDIO_PRODUCCION", centroId);
        const rawFolderId = await findOrCreateFolder(drive, "03_RAW", estudioId);
        const audioFolderId = await findOrCreateFolder(drive, "02_AUDIO", estudioId);

        const res = await drive.files.list({
            q: `'${inboxId}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType)',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        });

        const processed = [];
        const files = res.data.files || [];

        const brand = (product.vendor || product.sku || 'PROD')
            .toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9]/g, '').slice(0, 6);

        for (const file of files) {
            if (!file.id || !file.name) continue;

            const isVideo = file.mimeType?.startsWith('video/');
            const isAudio = file.mimeType?.startsWith('audio/');
            const targetFolderId = isVideo ? rawFolderId : (isAudio ? audioFolderId : null);

            if (targetFolderId) {
                const timestamp = new Date().getTime();
                const ext = file.name.split('.').pop();
                const newName = `${brand}_RAW_${timestamp}.${ext}`;

                await drive.files.update({
                    fileId: file.id,
                    addParents: targetFolderId,
                    removeParents: inboxId,
                    requestBody: { name: newName },
                    supportsAllDrives: true
                } as any);

                processed.push({ original: file.name, processed: newName });
            }
        }

        if (processed.length > 0) {
            await syncProductIndex(productId, storeId);
        }

        return { success: true, processed };
    } catch (e: any) {
        console.error('[DriveService] processInbox failed:', e);
        return { success: false, error: e.message };
    }
}

/**
 * ── Landing Builder Integration ─────────────────────────────────────────────
 */

export async function getLandingAssets(productId: string) {
    try {
        const drive = await getDriveClient();
        const product = await (prisma as any).product.findUnique({
            where: { id: productId },
            select: { driveFolderId: true }
        });

        if (!product?.driveFolderId) return [];

        const centroId = await findOrCreateFolder(drive, "CENTRO_CREATIVO", product.driveFolderId);
        const assetsId = await findOrCreateFolder(drive, "06_ASSETS", centroId);
        const imagesId = await findOrCreateFolder(drive, "IMAGENES_LANDING", assetsId);

        const res = await drive.files.list({
            q: `'${imagesId}' in parents and trashed = false and mimeType contains 'image/'`,
            fields: 'files(id, name, webContentLink, webViewLink, thumbnailLink)',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        });

        return (res.data.files || []).map(f => ({
            id: f.id,
            name: f.name,
            url: f.webContentLink || f.webViewLink,
            thumbnail: f.thumbnailLink
        }));
    } catch (e) {
        console.error('[DriveService] getLandingAssets failed:', e);
        return [];
    }
}

export async function saveLandingProject(productId: string, storeId: string, type: string, version: number, content: any) {
    try {
        const drive = await getDriveClient();
        const product = await (prisma as any).product.findUnique({
            where: { id: productId },
            select: { driveFolderId: true }
        });

        if (!product?.driveFolderId) throw new Error("Drive no configurado");

        const centroId = await findOrCreateFolder(drive, "CENTRO_CREATIVO", product.driveFolderId);
        const landingsId = await findOrCreateFolder(drive, "05_LANDINGS", centroId);
        const typeId = await findOrCreateFolder(drive, type.toUpperCase(), landingsId);
        const versionId = await findOrCreateFolder(drive, `V${String(version).padStart(2, '0')}`, typeId);

        // Save index.json for the landing
        const fileName = 'landing_data.json';
        const search = await drive.files.list({
            q: `name = '${fileName}' and '${versionId}' in parents and trashed = false`,
            fields: 'files(id)',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        });

        const fileMetadata = { name: fileName, parents: [versionId], mimeType: 'application/json' };
        const media = { mimeType: 'application/json', body: JSON.stringify(content, null, 2) };

        if (search.data.files && search.data.files.length > 0) {
            await drive.files.update({
                fileId: search.data.files[0].id,
                media: media,
                supportsAllDrives: true
            } as any);
        } else {
            await drive.files.create({
                requestBody: fileMetadata,
                media: media,
                supportsAllDrives: true
            });
        }

        await syncProductIndex(productId, storeId);
        return { success: true, folderId: versionId };
    } catch (e: any) {
        console.error('[DriveService] saveLandingProject failed:', e);
        return { success: false, error: e.message };
    }
}
