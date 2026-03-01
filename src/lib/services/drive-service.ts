/**
 * ─── Drive Service — EcomBom Creativo ───────────────────────────────────────
 * Servicio central para toda la interacción con Google Drive.
 * Gestiona la estructura Spencer Pawlin automáticamente.
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

// ── Spencer nomenclature ──────────────────────────────────────────────────────
/**
 * Build a Spencer Pawlin nomenclature string
 * [PROD]_[CONCEPT]_[ANGLE]_[AVATAR]_[FUNNEL]_[TYPE]_[VERSION]
 */
export function buildNomenclature(opts: {
    prodCode: string;      // PE, CH...
    conceptCode: string;   // C01, C02
    angleCode?: string;    // ANG01
    avatarCode?: string;   // AV03
    funnelStage: string;   // TOF | MOF | BOF | RT-CART | RT-VIEW | RT-BUYER
    type: string;          // UGC | FACE | DEMO | STATIC | ADV | LIST | PDP
    version?: number;      // 1 → V01
    ext?: string;          // mp4, txt...
}): string {
    const v = `V${String(opts.version ?? 1).padStart(2, '0')}`;
    const parts = [
        opts.prodCode.toUpperCase(),
        opts.conceptCode.toUpperCase(),
        opts.angleCode?.toUpperCase() ?? '',
        opts.avatarCode?.toUpperCase() ?? '',
        opts.funnelStage.toUpperCase(),
        opts.type.toUpperCase(),
        v,
    ].filter(Boolean);
    const name = parts.join('_');
    return opts.ext ? `${name}.${opts.ext}` : name;
}

/** Derive product code from title (first 2-3 uppercase letters) */
export function productCode(title: string): string {
    return title
        .split(/\s+/)
        .map(w => w[0]?.toUpperCase() ?? '')
        .join('')
        .slice(0, 3) || 'PRD';
}

// ── Folder path builders ──────────────────────────────────────────────────────
export const DrivePaths = {
    root: (storeId: string) => `ECOMBOOM/${storeId}`,
    product: (storeId: string, productId: string) => `ECOMBOOM/${storeId}/${productId}`,
    research: (storeId: string, productId: string) => `ECOMBOOM/${storeId}/${productId}/00_RESEARCH`,
    spy: (storeId: string, productId: string) => `ECOMBOOM/${storeId}/${productId}/01_SPY`,
    concepts: (storeId: string, productId: string) => `ECOMBOOM/${storeId}/${productId}/02_CONCEPTS`,
    concept: (storeId: string, productId: string, code: string, name: string) =>
        `ECOMBOOM/${storeId}/${productId}/02_CONCEPTS/${code}_${name.toUpperCase().replace(/\s+/g, '_').slice(0, 20)}`,
    conceptClips: (storeId: string, productId: string, code: string) =>
        `ECOMBOOM/${storeId}/${productId}/02_CONCEPTS/${code}_*/clips`,
    conceptScripts: (storeId: string, productId: string, code: string) =>
        `ECOMBOOM/${storeId}/${productId}/02_CONCEPTS/${code}_*/scripts`,
    landings: (storeId: string, productId: string) => `ECOMBOOM/${storeId}/${productId}/03_LANDINGS`,
    assets: (storeId: string, productId: string) => `ECOMBOOM/${storeId}/${productId}/04_ASSETS`,
    images: (storeId: string, productId: string) => `ECOMBOOM/${storeId}/${productId}/04_ASSETS/imagenes`,
    branding: (storeId: string, productId: string) => `ECOMBOOM/${storeId}/${productId}/04_ASSETS/branding`,
    theme: (storeId: string, productId: string) => `ECOMBOOM/${storeId}/${productId}/04_ASSETS/tema`,
    index: (storeId: string, productId: string) => `ECOMBOOM/${storeId}/${productId}/index.json`,
};

// ── Google Drive API wrapper ───────────────────────────────────────────────────
async function getDriveClient() {
    // Build auth from GCP credentials
    const { google } = await import('googleapis');
    const auth = new google.auth.GoogleAuth({
        credentials: process.env.GOOGLE_SERVICE_ACCOUNT ?
            JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT) : undefined,
        keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        scopes: [
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/drive.file',
        ],
    });
    return google.drive({ version: 'v3', auth });
}

async function findOrCreateFolder(drive: any, name: string, parentId?: string): Promise<string> {
    const q = [`name = '${name}'`, `mimeType = 'application/vnd.google-apps.folder'`, `trashed = false`];
    if (parentId) q.push(`'${parentId}' in parents`);

    const res = await drive.files.list({ q: q.join(' and '), fields: 'files(id,name)', pageSize: 5 });
    if (res.data.files?.length > 0) return res.data.files[0].id;

    const created = await drive.files.create({
        requestBody: { name, mimeType: 'application/vnd.google-apps.folder', parents: parentId ? [parentId] : [] },
        fields: 'id',
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
        const rootId = await findOrCreateFolder(drive, 'ECOMBOOM');
        // Store folder
        const store = await (prisma as any).store.findUnique({ where: { id: storeId }, select: { name: true } });
        const storeName = store?.name?.replace(/\s+/g, '_').toUpperCase() ?? storeId;
        const storeFolderId = await findOrCreateFolder(drive, `STORE_${storeName}`, rootId);
        // Config folder
        await findOrCreateFolder(drive, '_CONFIG', storeFolderId);

        await (prisma as any).store.update({
            where: { id: storeId },
            data: { driveFolderId: storeFolderId, driveSetupDone: true }
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
            select: { driveFolderId: true, name: true }
        });
        const product = await (prisma as any).product.findUnique({
            where: { id: productId },
            select: { title: true }
        });

        let storeFolderId = store?.driveFolderId;
        if (!storeFolderId) storeFolderId = await setupStoreDrive(storeId);

        const prodCode = productCode(product?.title ?? productId);
        const prodName = `${prodCode}_${(product?.title ?? productId).toUpperCase().replace(/\s+/g, '_').slice(0, 20)}`;
        const prodFolderId = await findOrCreateFolder(drive, prodName, storeFolderId);

        // Create subfolders
        const subfolders = ['00_RESEARCH', '01_SPY', '02_CONCEPTS', '03_LANDINGS', '04_ASSETS'];
        for (const folder of subfolders) {
            await findOrCreateFolder(drive, folder, prodFolderId);
        }
        // 01_SPY subfolders
        const spyFolder = await findOrCreateFolder(drive, '01_SPY', prodFolderId);
        await findOrCreateFolder(drive, 'ads', spyFolder);
        await findOrCreateFolder(drive, 'landings', spyFolder);

        // 04_ASSETS subfolders
        const assetsFolder = await findOrCreateFolder(drive, '04_ASSETS', prodFolderId);
        await findOrCreateFolder(drive, 'imagenes', assetsFolder);
        await findOrCreateFolder(drive, 'branding', assetsFolder);
        await findOrCreateFolder(drive, 'tema', assetsFolder);

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
        });

        await (prisma as any).product.update({
            where: { id: productId },
            data: {
                driveFolderId: prodFolderId,
                driveSetupDone: true,
                driveIndexPath: `${prodName}/index.json`,
            }
        });

        return prodFolderId;
    } catch (e) {
        console.error('[DriveService] setupProductDrive failed:', e);
        throw e;
    }
}

// ── Index management ──────────────────────────────────────────────────────────
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
    opts: { conceptCode?: string; funnelStage?: string; fileType?: string }
): Promise<{ driveFileId: string; drivePath: string; nomenclature?: string }> {
    const drive = await getDriveClient();
    const product = await (prisma as any).product.findUnique({
        where: { id: productId },
        select: { driveFolderId: true, title: true }
    });

    let folderId = product?.driveFolderId;
    if (!folderId) folderId = await setupProductDrive(productId, storeId);

    // Determine target subfolder
    let subFolder = folderId;
    if (opts.fileType === 'VIDEO' && opts.conceptCode) {
        const conceptsFolder = await findOrCreateFolder(drive, '02_CONCEPTS', folderId);
        const conceptFolder = await findOrCreateFolder(drive, opts.conceptCode, conceptsFolder);
        if (opts.funnelStage) {
            subFolder = await findOrCreateFolder(drive, opts.funnelStage, conceptFolder);
        } else {
            subFolder = conceptFolder;
        }
    } else if (opts.fileType === 'IMAGE') {
        const assetsFolder = await findOrCreateFolder(drive, '04_ASSETS', folderId);
        subFolder = await findOrCreateFolder(drive, 'imagenes', assetsFolder);
    } else if (opts.fileType === 'SCRIPT') {
        const conceptsFolder = await findOrCreateFolder(drive, '02_CONCEPTS', folderId);
        const conceptFolder = await findOrCreateFolder(drive, opts.conceptCode ?? 'MISC', conceptsFolder);
        subFolder = await findOrCreateFolder(drive, 'scripts', conceptFolder);
    }

    const res = await drive.files.create({
        requestBody: { name: fileName, parents: [subFolder] },
        media: { mimeType, body: require('stream').Readable.from(fileBuffer) },
        fields: 'id,name,webViewLink',
    });

    const driveFileId = res.data.id!;
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
        },
        update: { syncedAt: new Date(), drivePath },
    });

    invalidateProductIndex(productId);
    return { driveFileId, drivePath };
}
