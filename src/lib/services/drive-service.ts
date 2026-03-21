/**
 * ─── Drive Service — EcomBom Creativo ───────────────────────────────────────
 * Servicio central para toda la interacción con Google Drive.
 * Gestiona la estructura IA Pro automáticamente.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { prisma } from '@/lib/prisma';
import { 
    buildNomenclature, 
    CREATIVE_CONCEPTS, 
    TRAFFIC_TEMPS, 
    AWARENESS_LEVELS,
    getDrivePath
} from '@/lib/creative/spencer-knowledge';

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

// ── Folder path builders ──────────────────────────────────────────────────────
export const DrivePaths = {
    root: (storeId: string) => `ECOMBOOM/${storeId}`,
    product: (storeId: string, sku: string) => `ECOMBOOM/${storeId}/${sku}`,
    concept: (storeId: string, sku: string, cNum: number, cName: string) =>
        `ECOMBOOM/${storeId}/${sku}/C${cNum}_${cName.replace(/\s+/g, '')}`,
    version: (storeId: string, sku: string, cNum: number, cName: string, version: string) =>
        `ECOMBOOM/${storeId}/${sku}/C${cNum}_${cName.replace(/\s+/g, '')}/${version}`,
    research: (storeId: string, sku: string) => `ECOMBOOM/${storeId}/${sku}/1_INVESTIGACION`,
    landings: (storeId: string, sku: string) => `ECOMBOOM/${storeId}/${sku}/5_LANDINGS`,
    assets: (storeId: string, sku: string) => `ECOMBOOM/${storeId}/${sku}/6_ASSETS`,
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
            'https://www.googleapis.com/auth/drive.metadata',
            'https://www.googleapis.com/auth/drive.metadata.readonly',
        ],
    });
    return google.drive({ version: 'v3', auth });
}

export async function findOrCreateFolder(
    drive: any,
    name: string,
    parentId?: string
): Promise<string> {
    const ROOT_ID = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || '0AKpcFZDnKLgZUk9PVA';
    const effectiveParentId = parentId || ROOT_ID;

    const safeName = name.replace(/'/g, "\\'");
    const q = [
        `name = '${safeName}'`,
        `mimeType = 'application/vnd.google-apps.folder'`,
        `'${effectiveParentId}' in parents`,
        `trashed = false`
    ].join(' and ');

    console.log(`[DriveService] Searching folder: "${name}" (Parent: ${effectiveParentId})`);

    const res = await drive.files.list({
        q,
        fields: 'files(id, name)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        corpora: 'allDrives',
        pageSize: 1,
    });

    if (res.data.files?.length > 0) {
        const foundId = res.data.files[0].id;
        console.log(`[DriveService] Found folder: "${name}" -> ${foundId}`);
        return foundId;
    }

    console.log(`[DriveService] Creating folder: "${name}" inside ${effectiveParentId}`);

    try {
        const created = await drive.files.create({
            requestBody: {
                name,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [effectiveParentId],
            },
            fields: 'id',
            supportsAllDrives: true,
        });

        console.log(`[DriveService] ✅ Created: "${name}" -> ${created.data.id}`);
        return created.data.id!;
    } catch (createErr: any) {
        if (createErr.code === 403 || createErr.message?.includes('permission')) {
            console.error(`[DriveService] PERMISSION ERROR: Service account cannot write to ${effectiveParentId}.`);
            console.error(`Add ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL} as Content Manager in the Shared Drive.`);
        }
        throw createErr;
    }
}

/**
 * findOrCreatePath - Crea una serie de carpetas anidadas a partir de un path 'A/B/C'.
 */
export async function findOrCreatePath(drive: any, path: string, rootId: string): Promise<string> {
    const parts = path.split('/').filter(Boolean);
    let currentParentId = rootId;
    for (const part of parts) {
        currentParentId = await findOrCreateFolder(drive, part, currentParentId);
    }
    return currentParentId;
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
        const ROOT_ID = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || '0AKpcFZDnKLgZUk9PVA';
        console.log(`[DriveService] Absolute Root ID: ${ROOT_ID}`);
        
        const store = await (prisma as any).store.findUnique({ where: { id: storeId }, select: { name: true } });
        const storeName = store?.name?.replace(/\s+/g, '_').toUpperCase() ?? storeId;
        
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

        // Nombre carpeta: SKU_NOMBRE (ej: MICRLIFT_PARCHES_MICROLIFT)
        const skuPart = product?.sku || '';
        // Usar solo las primeras 2 palabras del título, sin caracteres especiales
        const titleWords = (product?.title || productId)
            .replace(/[™®©|\-]/g, ' ')
            .trim().split(/\s+/).slice(0, 2)
            .join('_').toUpperCase()
            .replace(/[^A-Z0-9_]/g, '');
        const prodSku = skuPart ? `${skuPart}_${titleWords}` : titleWords;

        const prodFolderId = await findOrCreateFolder(drive, prodSku, storeFolderId);

        // ── ESTRUCTURA DEFINITIVA ──────────────────────────────────────

        // 1_INVESTIGACION
        const inv1Id = await findOrCreateFolder(drive, '1_INVESTIGACION', prodFolderId);
        await findOrCreateFolder(drive, 'P1_PRODUCTO', inv1Id);
        await findOrCreateFolder(drive, 'P2_AVATARES', inv1Id);
        await findOrCreateFolder(drive, 'P3_COMPETENCIA', inv1Id);
        await findOrCreateFolder(drive, 'P4_ANGULOS', inv1Id);
        await findOrCreateFolder(drive, 'P5_HOOKS', inv1Id);
        await findOrCreateFolder(drive, 'P6_OBJECIONES', inv1Id);
        await findOrCreateFolder(drive, 'P7_OFERTA', inv1Id);

        // 2_CREATIVOS — carpetas C1-C9 creadas dinámicamente por el agente
        await findOrCreateFolder(drive, '2_CREATIVOS', prodFolderId);

        // 3_ESTATICOS — misma estructura que 2_CREATIVOS
        await findOrCreateFolder(drive, '3_ESTATICOS', prodFolderId);

        // 4_COMPETENCIA
        const compId = await findOrCreateFolder(drive, '4_COMPETENCIA', prodFolderId);
        await findOrCreateFolder(drive, 'INBOX', compId);

        // 5_LANDINGS
        const landingsId = await findOrCreateFolder(drive, '5_LANDINGS', prodFolderId);
        await findOrCreateFolder(drive, 'SPY', landingsId);
        await findOrCreateFolder(drive, 'CLONES', landingsId);
        await findOrCreateFolder(drive, 'ADAPTADAS', landingsId);

        // 6_ASSETS
        const assetsId = await findOrCreateFolder(drive, '6_ASSETS', prodFolderId);
        await findOrCreateFolder(drive, 'PRODUCTO', assetsId);
        await findOrCreateFolder(drive, 'PACKAGING', assetsId);
        await findOrCreateFolder(drive, 'AVATARES', assetsId);

        // ── FIN ESTRUCTURA ─────────────────────────────────────────────

        // Guardar en BD
        await (prisma as any).product.update({
            where: { id: productId },
            data: {
                driveFolderId: prodFolderId,
                driveRootPath: JSON.stringify({ root: prodFolderId, sku: prodSku }),
                driveSetupDone: true,
            }
        });

        return prodFolderId;
    } catch (e) {
        console.error('[DriveService] setupProductDrive failed:', e);
        throw e;
    }
}


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

export async function uploadToProduct(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    productId: string,
    storeId: string,
    opts: { conceptCode?: string; funnelStage?: string; angle?: string; fileType?: string; creativeArtifactId?: string; subfolderName?: string; version?: number }
): Promise<{ driveFileId: string; drivePath: string; driveUrl: string; parentFolderId: string; thumbnailUrl?: string }> {
    const drive = await getDriveClient();
    const product = await (prisma as any).product.findUnique({
        where: { id: productId },
        select: { driveFolderId: true, title: true }
    });

    let folderId = product?.driveFolderId;
    if (!folderId) folderId = await setupProductDrive(productId, storeId);

    let subFolder = folderId;

    if (opts.conceptCode) {
        const biblioId = await findOrCreateFolder(drive, "2_CREATIVOS", folderId);
        const parentConceptsId = biblioId;
        
        const conceptName = opts.conceptCode.toUpperCase().replace(/\s+/g, '_');
        const conceptFolderId = await findOrCreateFolder(drive, conceptName, parentConceptsId);
        
        const stageName = (opts.funnelStage || 'TOFU').toUpperCase();
        const stageFolderId = await findOrCreateFolder(drive, stageName, conceptFolderId);
        
        const angleName = (opts.angle || 'GENERAL').toUpperCase().replace(/\s+/g, '_');
        const angleFolderId = await findOrCreateFolder(drive, angleName, stageFolderId);

        subFolder = angleFolderId;

        if (opts.subfolderName) {
            if (opts.subfolderName.includes('/')) {
                subFolder = await findOrCreatePath(drive, opts.subfolderName.toUpperCase(), folderId);
            } else {
                subFolder = await findOrCreateFolder(drive, opts.subfolderName.toUpperCase(), subFolder);
            }
        }
    } else if (opts.fileType === 'IMAGE') {
        const assetsFolder = await findOrCreateFolder(drive, '6_ASSETS', folderId);
        subFolder = await findOrCreateFolder(drive, 'IMAGENES_LANDING', assetsFolder);
    }

    const res = await drive.files.create({
        requestBody: { name: fileName, parents: [subFolder] },
        media: { mimeType, body: require('stream').Readable.from(fileBuffer) },
        fields: 'id,name,webViewLink,webContentLink,thumbnailLink',
        supportsAllDrives: true
    });

    const driveFileId = res.data.id!;
    const driveUrl = res.data.webContentLink;
    const thumbnailUrl = res.data.thumbnailLink;
    const drivePath = `${opts.conceptCode ?? ''}/${opts.funnelStage ?? ''}/${fileName}`;

    await (prisma as any).driveAsset.upsert({
        where: { driveFileId },
        create: {
            productId,
            storeId,
            driveFileId,
            driveUrl: res.data.webViewLink || '',
            drivePath,
            fileName,
            mimeType,
            assetType: opts.fileType || 'VIDEO',
            fileType: opts.fileType || 'VIDEO',
            conceptCode: opts.conceptCode || null,
            funnelStage: opts.funnelStage || null,
            angle: opts.angle || null,
            nomenclature: fileName,
            organized: true,
            syncedAt: new Date(),
            agentReadable: true,
            metadata: {
                webViewLink: res.data.webViewLink,
                webContentLink: res.data.webContentLink,
                thumbnailLink: res.data.thumbnailLink,
                version: opts.version,
            }
        },
        update: {
            driveUrl: res.data.webViewLink || '',
            drivePath,
            syncedAt: new Date(),
            conceptCode: opts.conceptCode || undefined,
            funnelStage: opts.funnelStage || undefined,
        }
    });

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
    return { driveFileId, drivePath, driveUrl: driveUrl || '', parentFolderId: subFolder, thumbnailUrl: thumbnailUrl || undefined };
}

export async function uploadToInbox(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    productId: string,
    storeId: string,
    subfolder: string = 'VIDEOS'
): Promise<{ driveFileId: string; drivePath: string }> {
    const drive = await getDriveClient();
    const product = await (prisma as any).product.findUnique({
        where: { id: productId },
        select: { driveFolderId: true }
    });

    let folderId = product?.driveFolderId;
    if (!folderId) folderId = await setupProductDrive(productId, storeId);

    const inboxId = await findOrCreateFolder(drive, "4_COMPETENCIA/INBOX", folderId);
    const targetFolderId = await findOrCreateFolder(drive, subfolder, inboxId);

    const res = await drive.files.create({
        requestBody: { name: fileName, parents: [targetFolderId] },
        media: { mimeType, body: require('stream').Readable.from(fileBuffer) },
        fields: 'id',
        supportsAllDrives: true
    });

    return { 
        driveFileId: res.data.id!, 
        drivePath: `INBOX/${subfolder}/${fileName}` 
    };
}

export async function saveAnalysisDoc(
    productId: string,
    storeId: string,
    folderId: string,
    fileName: string,
    content: string
) {
    try {
        const drive = await getDriveClient();
        
        const res = await drive.files.create({
            requestBody: {
                name: fileName,
                parents: [folderId],
                mimeType: 'application/vnd.google-apps.document'
            },
            media: {
                mimeType: 'text/plain',
                body: content
            },
            fields: 'id,webViewLink',
            supportsAllDrives: true
        });

        return { driveFileId: res.data.id, driveUrl: res.data.webViewLink };
    } catch (e) {
        console.error('[DriveService] saveAnalysisDoc failed:', e);
        return null;
    }
}

export async function downloadFile(fileId: string): Promise<Buffer> {
    const drive = await getDriveClient();
    const res = await (drive.files.get as any)({
        fileId,
        alt: 'media',
        supportsAllDrives: true
    }, { responseType: 'arraybuffer' });
    return Buffer.from(res.data);
}

export async function getLandingAssets(productId: string): Promise<DriveFileEntry[]> {
    const drive = await getDriveClient();
    const product = await (prisma as any).product.findUnique({
        where: { id: productId },
        select: { driveFolderId: true }
    });
    if (!product?.driveFolderId) return [];

    // Buscar en 5_LANDINGS/IMAGENES_LANDING o 6_ASSETS/IMAGENES_LANDING
    const centroId = product.driveFolderId;
    const assetsFolder = await findOrCreateFolder(drive, '6_ASSETS', centroId);
    const landingImagesId = await findOrCreateFolder(drive, 'IMAGENES_LANDING', assetsFolder);

    const res = await drive.files.list({
        q: `'${landingImagesId}' in parents and trashed = false`,
        fields: 'files(id,name,mimeType,size,thumbnailLink)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true
    });

    return (res.data.files ?? []).map((f: any) => ({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        size: f.size ? parseInt(f.size) : undefined,
        path: `LANDING_IMAGES/${f.name}`,
        thumbnailUrl: f.thumbnailLink,
    }));
}

export async function saveLandingProject(
    productId: string,
    storeId: string,
    type: string,
    version: number,
    content: any
): Promise<{ ok: true; fileId: string }> {
    const drive = await getDriveClient();
    const product = await (prisma as any).product.findUnique({
        where: { id: productId },
        select: { driveFolderId: true }
    });
    
    let folderId = product?.driveFolderId;
    if (!folderId) folderId = await setupProductDrive(productId, storeId);

    const landingsFolderId = await findOrCreateFolder(drive, '5_LANDINGS', folderId);
    const typeFolderId = await findOrCreateFolder(drive, type.toUpperCase(), landingsFolderId);
    
    const fileName = `landing_v${version}.json`;
    
    const res = await drive.files.create({
        requestBody: {
            name: fileName,
            parents: [typeFolderId],
            mimeType: 'application/json'
        },
        media: {
            mimeType: 'application/json',
            body: JSON.stringify(content, null, 2)
        },
        fields: 'id',
        supportsAllDrives: true
    });

    return { ok: true, fileId: res.data.id! };
}

export async function processInbox(productId: string, storeId: string) {
    const drive = await getDriveClient();
    const product = await (prisma as any).product.findUnique({
        where: { id: productId },
        select: { driveFolderId: true, sku: true }
    });
    
    if (!product?.driveFolderId) return { error: 'No drive folder' };

    const centroId = product.driveFolderId;
    const inboxId = await findOrCreateFolder(drive, "4_COMPETENCIA/INBOX", centroId);

    const res = await drive.files.list({
        q: `'${inboxId}' in parents and trashed = false`,
        fields: 'files(id,name,mimeType,size)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true
    });

    const files = res.data.files || [];
    const results: any[] = [];

    for (const file of files) {
        if (file.mimeType === 'application/vnd.google-apps.folder') continue;
        if (!file.name || !file.id || !file.mimeType) continue;

        // Parse nomenclature: SKU-C1-V1.mp4
        const nameParts = file.name.split('-');
        if (nameParts.length < 3) {
             results.push({ name: file.name, status: 'SKIPPED', reason: 'Invalid nomenclature' });
             continue;
        }

        const conceptCode = nameParts[1]; // C1, C2...
        
        // Determinar destino (Spencer logic)
        const creativeConcept = CREATIVE_CONCEPTS.find((c: any) => (c as any).code === conceptCode);
        if (!creativeConcept) {
             results.push({ name: file.name, status: 'SKIPPED', reason: 'Concept not found' });
             continue;
        }

        const traffic = (creativeConcept as any).traffic[0];
        const awareness = (creativeConcept as any).awareness[0];
        
        const subPath = getDrivePath({ concept: conceptCode, traffic, awareness });
        const targetFolderId = await findOrCreatePath(drive, subPath, centroId);

        // Mover archivo
        await drive.files.update({
            fileId: file.id,
            addParents: targetFolderId,
            removeParents: inboxId,
            supportsAllDrives: true
        });

        // Registrar en DB
        await (prisma as any).creativeAsset.create({
            data: {
                storeId,
                productId,
                name: file.name.split('.')[0],
                driveFileId: file.id,
                drivePath: `${subPath}/${file.name}`,
                driveUrl: `https://drive.google.com/uc?id=${file.id}`,
                fileType: file.mimeType.startsWith('video/') ? 'VIDEO' : 'IMAGE',
                conceptCode,
                funnelStage: traffic,
                processingStatus: 'READY'
            }
        });

        results.push({ name: file.name, status: 'MOVED', target: subPath });
    }

    invalidateProductIndex(productId);
    await syncProductIndex(productId, storeId);

    return { ok: true, processed: results.length, results };
}

/**
 * Sube texto plano como archivo .txt a Drive bajo la carpeta del producto.
 */
export async function uploadTextToDrive(
    productId: string,
    storeId: string,
    fileName: string,
    content: string,
    opts: { subfolderName?: string; fileType?: string } = {}
): Promise<{ driveFileId: string; driveUrl: string }> {
    const buffer = Buffer.from(content, 'utf-8');
    const result = await uploadToProduct(
        buffer,
        fileName,
        'text/plain',
        productId,
        storeId,
        { ...opts, fileType: opts.fileType || 'TEXT' }
    );
    return { driveFileId: result.driveFileId, driveUrl: result.driveUrl };
}

// ── CONCEPTOS CREATIVOS ────────────────────────────────────────────────────
export const CONCEPTS = {
    C1: 'PROBLEMA',
    C2: 'ANTES_DESPUES',
    C3: 'MECANISMO',
    C4: 'PRUEBA_SOCIAL',
    C5: 'OFERTA',
    C6: 'OBJECION',
    C7: 'RESULTADO',
    C8: 'EDUCACION',
    C9: 'AUTORIDAD',
} as const;

export type ConceptKey = keyof typeof CONCEPTS;
export type Phase = 'FRIO' | 'TEMPLADO' | 'CALIENTE' | 'RETARGETING';

/**
 * Crea o encuentra la carpeta de un concepto + fase dentro de CREATIVOS o COMPETENCIA.
 * Ejemplo: CREATIVOS/C2_ANTES_DESPUES/FRIO
 */
export async function getOrCreateConceptFolder(
    productRootId: string,
    section: 'CREATIVOS' | 'ESTATICOS' | 'COMPETENCIA',
    concept: ConceptKey,
    phase: Phase
): Promise<string> {
    const drive = await getDriveClient();

    // Encontrar carpeta raíz de la sección
    const sectionMap: Record<string, string> = {
        'CREATIVOS': '2_CREATIVOS',
        'ESTATICOS': '3_ESTATICOS',
        'COMPETENCIA': '4_COMPETENCIA',
    };
    const sectionFolderName = sectionMap[section] || section;
    const sectionId = await findOrCreateFolder(drive, sectionFolderName, productRootId);

    // Carpeta del concepto: C2_ANTES_DESPUES
    const conceptFolder = `${concept}_${CONCEPTS[concept]}`;
    const conceptId = await findOrCreateFolder(drive, conceptFolder, sectionId);

    // Carpeta de la fase: FRIO
    const phaseId = await findOrCreateFolder(drive, phase, conceptId);

    return phaseId;
}

/**
 * Sube un documento de research a la carpeta correcta dentro de 1_INVESTIGACION
 * path: ej "1_INVESTIGACION/P1_PRODUCTO"
 */
export async function saveResearchDoc(
    productRootFolderId: string,
    path: string,
    fileName: string,
    content: string,
    opts?: { supportsAllDrives?: boolean }
): Promise<{ driveFileId: string | null | undefined; driveUrl: string | null | undefined } | null> {
    try {
        const drive = await getDriveClient();
        const targetFolderId = await findOrCreatePath(drive, path, productRootFolderId);
        
        const res = await drive.files.create({
            requestBody: {
                name: fileName,
                parents: [targetFolderId],
                mimeType: 'application/vnd.google-apps.document'
            },
            media: {
                mimeType: 'text/plain',
                body: content
            },
            fields: 'id,webViewLink',
            supportsAllDrives: opts?.supportsAllDrives ?? true
        });

        console.log(`[DriveService] ✅ Research doc saved: ${fileName} -> ${path}`);
        return { driveFileId: res.data.id, driveUrl: res.data.webViewLink };
    } catch (e: any) {
        console.error('[DriveService] saveResearchDoc failed:', e.message);
        return null;
    }
}
