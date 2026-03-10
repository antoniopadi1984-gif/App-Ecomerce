/**
 * Google Drive — cliente canónico EcomBoom
 * Service Account: app-ecombom@gen-lang-client-0246473908.iam.gserviceaccount.com
 * Root: 1-3S_uYhq3mEBbtPNwNP3gXSLCN-yEmp8 (Ecombom Control)
 *
 * Estructura canónica:
 * Ecombom Control/
 *   [STORE_ID]/
 *     _CONFIG/
 *     [PROD_SKU]_[PROD_TITLE]/
 *       00_INBOX/
 *       01_RESEARCH/
 *       02_SPY/
 *       03_CONCEPTOS/
 *       04_PRODUCCION/
 *       05_LANDINGS/
 *       06_ASSETS/
 *       07_AVATARES_IA/
 *       08_BIBLIOTECA/
 *
 * REGLA: Drive es almacenamiento visual. La verdad está en DB (DriveFolder table).
 * Los agentes NUNCA buscan carpetas en Drive — preguntan a la DB.
 */

import { prisma } from '@/lib/prisma';
import { google } from 'googleapis';

const ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || '1-3S_uYhq3mEBbtPNwNP3gXSLCN-yEmp8';

const PRODUCT_SUBFOLDERS = [
    '00_INBOX',
    '01_RESEARCH',
    '02_SPY',
    '03_CONCEPTOS',
    '04_PRODUCCION',
    '05_LANDINGS',
    '06_ASSETS',
    '07_AVATARES_IA',
    '08_BIBLIOTECA',
] as const;

export type ProductSubfolder = typeof PRODUCT_SUBFOLDERS[number];

// ─── Auth ─────────────────────────────────────────────────────────────────────

function getDriveClient() {
    const saKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');
    const auth = new google.auth.GoogleAuth({
        credentials: saKey,
        scopes: ['https://www.googleapis.com/auth/drive'],
    });
    return google.drive({ version: 'v3', auth });
}

// ─── Core helpers ─────────────────────────────────────────────────────────────

/**
 * Busca una carpeta por nombre dentro de un parent. Si no existe, la crea.
 */
export async function getOrCreateFolder(name: string, parentId: string): Promise<string> {
    const drive = getDriveClient();

    // Buscar existente
    const res = await drive.files.list({
        q: `name='${name.replace(/'/g, "\\'")}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
        pageSize: 1,
    });

    if (res.data.files && res.data.files.length > 0) {
        return res.data.files[0].id!;
    }

    // Crear nueva
    const created = await drive.files.create({
        requestBody: {
            name,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentId],
        },
        fields: 'id',
    });

    return created.data.id!;
}

/**
 * Descarga y guarda un archivo en Drive desde una URL
 */
export async function uploadFileFromUrl(url: string, name: string, parentId: string, mimeType: string): Promise<string> {
    const drive = getDriveClient();
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Error fetching file: ${res.statusText}`);
    const buffer = Buffer.from(await res.arrayBuffer());

    const driveRes = await drive.files.create({
        requestBody: {
            name,
            mimeType,
            parents: [parentId]
        },
        media: {
            mimeType,
            body: require('stream').Readable.from([buffer])
        },
        fields: 'id'
    });
    return driveRes.data.id!;
}

// ─── Store folder ──────────────────────────────────────────────────────────────

/**
 * Obtiene o crea la carpeta de tienda dentro de Ecombom Control
 * Ejemplo: Ecombom Control/store-main/
 */
export async function getOrCreateStoreFolder(storeId: string, storeName: string): Promise<string> {
    const folderName = storeName.toUpperCase().replace(/\s+/g, '_');
    const folderId = await getOrCreateFolder(folderName, ROOT_FOLDER_ID);

    // Guardar en BD
    await (prisma as any).store.update({
        where: { id: storeId },
        data: { driveRootFolderId: folderId },
    }).catch(() => {}); // no falla si campo no existe aún

    // Crear _CONFIG dentro de la tienda
    await getOrCreateFolder('_CONFIG', folderId);

    return folderId;
}

// ─── Product folder structure ──────────────────────────────────────────────────

export interface ProductDriveStructure {
    productRootId: string;
    productRootPath: string;
    folders: Record<ProductSubfolder, string>;
}

/**
 * Crea la estructura completa de carpetas para un producto.
 * Idempotente — si ya existe, retorna los IDs existentes.
 */
export async function createProductDriveStructure(
    productId: string,
    productTitle: string,
    productSku: string | null,
    storeId: string,
    storeName: string
): Promise<ProductDriveStructure> {

    // 1. Store folder
    const storeFolderId = await getOrCreateStoreFolder(storeId, storeName);

    // 2. Product folder name: SKU_TITULO o solo TITULO
    const slug = productTitle
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .slice(0, 40);
    const folderName = productSku ? `${productSku}_${slug}` : slug;

    const productRootId = await getOrCreateFolder(folderName, storeFolderId);
    const productRootPath = `/EcomBoom/${storeName}/${folderName}/`;

    // 3. Crear las 9 subcarpetas
    const folders: Partial<Record<ProductSubfolder, string>> = {};

    for (const sub of PRODUCT_SUBFOLDERS) {
        const subId = await getOrCreateFolder(sub, productRootId);
        folders[sub] = subId;

        // Upsert en DriveFolder (BD)
        await (prisma as any).driveFolder.upsert({
            where: {
                productId_path: {
                    productId,
                    path: `${productRootPath}${sub}/`,
                }
            },
            update: { driveFolderId: subId },
            create: {
                storeId,
                productId,
                path: `${productRootPath}${sub}/`,
                driveFolderId: subId,
                label: sub,
            },
        }).catch(() => {}); // graceful — si el schema no tiene ese modelo aún
    }

    // 4. Crear index.json en la raíz del producto
    const drive = getDriveClient();
    const indexContent = JSON.stringify({
        productId,
        title: productTitle,
        sku: productSku,
        storeId,
        createdAt: new Date().toISOString(),
        folders,
        rootPath: productRootPath,
    }, null, 2);

    const indexBlob = Buffer.from(indexContent);
    await drive.files.create({
        requestBody: {
            name: 'index.json',
            mimeType: 'application/json',
            parents: [productRootId],
        },
        media: {
            mimeType: 'application/json',
            body: require('stream').Readable.from([indexBlob]),
        },
        fields: 'id',
    }).catch(() => {}); // no crítico si ya existe

    // 5. Actualizar producto en BD
    await (prisma as any).product.update({
        where: { id: productId },
        data: {
            driveSetupDone: true,
            driveRootPath: productRootPath,
            driveFolderId: productRootId,
        },
    }).catch(() => {});

    return {
        productRootId,
        productRootPath,
        folders: folders as Record<ProductSubfolder, string>,
    };
}

// ─── Concept folder (dentro de 03_CONCEPTOS) ──────────────────────────────────

/**
 * Estructura Spencer Mode para un concepto creativo:
 * 03_CONCEPTOS/CONCEPT_01_NOMBRE/ANGLE_A_NOMBRE/CREATIVE_01/
 *   RAW/ CLIPS/ SCRIPT/ AVATAR/ LANDING/ DATA/
 */
export async function createConceptFolder(params: {
    productId: string;
    storeId: string;
    conceptCode: string;   // ej: "C01"
    conceptName: string;   // ej: "VERGUENZA"
    angleCode?: string;    // ej: "A"
    angleName?: string;    // ej: "MIEDO"
    creativeNumber?: number; // ej: 1
}): Promise<{ conceptFolderId: string; creativeFolderId?: string }> {

    // Obtener carpeta 03_CONCEPTOS del producto desde BD
    const conceptosFolder = await (prisma as any).driveFolder.findFirst({
        where: { productId: params.productId, label: '03_CONCEPTOS' },
    });

    if (!conceptosFolder) throw new Error('Product Drive structure not initialized');

    // Concept folder: CONCEPT_01_VERGUENZA
    const conceptFolderName = `CONCEPT_${params.conceptCode}_${params.conceptName.toUpperCase().replace(/\s+/g, '_')}`;
    const conceptFolderId = await getOrCreateFolder(conceptFolderName, conceptosFolder.driveFolderId);

    if (!params.angleCode) return { conceptFolderId };

    // Angle folder: ANGLE_A_MIEDO
    const angleFolderName = `ANGLE_${params.angleCode}_${(params.angleName || '').toUpperCase().replace(/\s+/g, '_')}`;
    const angleFolderId = await getOrCreateFolder(angleFolderName, conceptFolderId);

    if (!params.creativeNumber) return { conceptFolderId, creativeFolderId: angleFolderId };

    // Creative folder: CREATIVE_01
    const creativeFolderName = `CREATIVE_${String(params.creativeNumber).padStart(2, '0')}`;
    const creativeFolderId = await getOrCreateFolder(creativeFolderName, angleFolderId);

    // Subcarpetas del creativo
    for (const sub of ['RAW', 'CLIPS', 'SCRIPT', 'AVATAR', 'LANDING', 'DATA']) {
        await getOrCreateFolder(sub, creativeFolderId);
    }

    return { conceptFolderId, creativeFolderId };
}

// ─── Utility: obtener ID de subcarpeta desde BD ────────────────────────────────

export async function getProductSubfolderID(
    productId: string,
    subfolder: ProductSubfolder
): Promise<string | null> {
    const folder = await (prisma as any).driveFolder.findFirst({
        where: { productId, label: subfolder },
    });
    return folder?.driveFolderId || null;
}

// ─── List files in subfolder ───────────────────────────────────────────────────

export async function listProductSubfolderFiles(productId: string, subfolder: ProductSubfolder) {
    const folderId = await getProductSubfolderID(productId, subfolder);
    if (!folderId) return [];

    const drive = getDriveClient();
    const res = await drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id, name, mimeType, size, createdTime, webViewLink, thumbnailLink)',
        pageSize: 100,
    });

    return res.data.files || [];
}
