import { google } from "googleapis";
import { prisma } from "./prisma";
import { getGoogleAuth } from './google-auth';

/**
 * DRIVE STRUCTURE MANAGER
 * Auto-creates comprehensive folder structure for each product following IA Pro methodology
 */

async function getDriveClient() {
    const auth = await getGoogleAuth('store-main');
    return google.drive({ version: "v3", auth });
}

export async function getAuthClient() {
    return getGoogleAuth('store-main');
}

async function getRootFolderId(drive: any, storeId: string): Promise<string> {
    const store = await prisma.store.findUnique({
        where: { id: storeId },
        select: { driveRootFolderId: true, name: true }
    });

    if (store?.driveRootFolderId) {
        return store.driveRootFolderId;
    }

    // Create root folder for store
    const folderMetadata = {
        name: `Ecombom - ${store?.name || storeId}`,
        mimeType: "application/vnd.google-apps.folder",
    };

    const folder = await drive.files.create({
        requestBody: folderMetadata,
        fields: "id",
    });

    await prisma.store.update({
        where: { id: storeId },
        data: { driveRootFolderId: folder.data.id }
    });

    return folder.data.id;
}

async function createFolder(drive: any, name: string, parentId: string): Promise<string> {
    const folderMetadata = {
        name,
        mimeType: "application/vnd.google-apps.folder",
        parents: [parentId],
    };

    const folder = await drive.files.create({
        requestBody: folderMetadata,
        fields: "id",
    });

    return folder.data.id;
}

interface FolderStructure {
    productRootId: string;
    centroCreativoId: string;
    inboxId: string;
    estudio: {
        root: string;
        iaVillages: string;
        audio: string;
        raw: string;
        proyectos: string;
    };
    biblioteca: {
        root: string;
        retargeting: {
            root: string;
            directo: string;
            problema: string;
            story: string;
        };
        conceptos: string;
        estaticos: string;
    };
}

/**
 * Creates complete folder structure for a product in Google Drive
 */
export async function createProductDriveStructure(
    productId: string,
    productTitle: string
): Promise<FolderStructure> {
    try {
        const drive = await getDriveClient();

        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { storeId: true, driveFolderId: true }
        });

        if (!product) throw new Error("Product not found");

        // Use existing folder or create new
        let productRootId: string;

        if (product.driveFolderId) {
            productRootId = product.driveFolderId;
        } else {
            const rootFolderId = await getRootFolderId(drive, product.storeId);
            const folderName = `PROD_${productTitle.toUpperCase().replace(/\s+/g, '_')}`;
            productRootId = await createFolder(drive, folderName, rootFolderId);

            await prisma.product.update({
                where: { id: productId },
                data: { driveFolderId: productRootId }
            });
        }

        console.log(`📁 Creating IA Pro structure for: ${productTitle}`);

        // 1. CENTRO_CREATIVO (Main folder for all creative work)
        const centroCreativoId = await createFolder(drive, "CENTRO_CREATIVO", productRootId);

        // ... rest of the code as before ...
        const inboxId = await createFolder(drive, "00_INBOX_SIN_PROCESAR", centroCreativoId);
        const estudioRootId = await createFolder(drive, "01_ESTUDIO_PRODUCCION", centroCreativoId);
        const estudio = {
            root: estudioRootId,
            iaVillages: await createFolder(drive, "01_IA_VILLAGES", estudioRootId),
            audio: await createFolder(drive, "02_AUDIO", estudioRootId),
            raw: await createFolder(drive, "03_RAW", estudioRootId),
            proyectos: await createFolder(drive, "04_PROYECTOS", estudioRootId),
        };

        const bibliotecaRootId = await createFolder(drive, "02_BIBLIOTECA_LISTOS_PARA_ADS", centroCreativoId);
        const retargetingRootId = await createFolder(drive, "01_RETARGETING", bibliotecaRootId);
        const biblioteca = {
            root: bibliotecaRootId,
            retargeting: {
                root: retargetingRootId,
                directo: await createFolder(drive, "R10_COPY_DIRECTO", retargetingRootId),
                problema: await createFolder(drive, "R20_COPY_PROBLEMA", retargetingRootId),
                story: await createFolder(drive, "R30_COPY_STORY", retargetingRootId),
            },
            conceptos: await createFolder(drive, "02_CONCEPTOS", bibliotecaRootId),
            estaticos: await createFolder(drive, "03_ESTATICOS", bibliotecaRootId),
        };

        const structure: FolderStructure = {
            productRootId,
            centroCreativoId,
            inboxId,
            estudio,
            biblioteca
        };

        // Save structure to product
        await prisma.product.update({
            where: { id: productId },
            data: {
                driveRootPath: JSON.stringify(structure)
            }
        });

        console.log(`✅ IA Pro Drive structure created for ${productTitle}`);
        return structure;

    } catch (error: any) {
        console.error("[createProductDriveStructure] Error:", error);
        throw new Error(`Failed to create IA Pro Drive structure: ${error.message}`);
    }
}

/**
 * Creates a specific concept folder structure within the product's CONCEPTOS folder
 */
export async function createConceptFolder(
    productId: string,
    conceptNum: number,
    conceptName: string
): Promise<string> {
    try {
        const drive = await getDriveClient();
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { driveRootPath: true }
        });

        if (!product?.driveRootPath) throw new Error("Product structure not found");
        const structure: FolderStructure = JSON.parse(product.driveRootPath as string);

        const conceptFolderName = `CONC_${String(conceptNum).padStart(2, '0')}_${conceptName.toUpperCase().replace(/\s+/g, '_')}`;
        const conceptId = await createFolder(drive, conceptFolderName, structure.biblioteca.conceptos);

        // Subfolders for concept following the methodology
        await createFolder(drive, "HOOKS", conceptId);
        await createFolder(drive, "SCRIPTS", conceptId);

        const videosId = await createFolder(drive, "VIDEOS_PROCESADOS", conceptId);
        await createFolder(drive, "VERSIONES", videosId);

        return conceptId;
    } catch (error: any) {
        console.error("[createConceptFolder] Error:", error);
        throw new Error(`Failed to create Concept folder: ${error.message}`);
    }
}

/**
 * Upload file to specific product folder
 */
export async function uploadToDrive(
    productId: string,
    file: Buffer,
    fileName: string,
    mimeType: string,
    targetFolderPath: string // Using ID directly if possible, or mapping
): Promise<string> {
    try {
        const drive = await getDriveClient();

        const fileMetadata = {
            name: fileName,
            parents: [targetFolderPath],
        };

        const media = {
            mimeType,
            body: require('stream').Readable.from(file),
        };

        const uploadedFile = await drive.files.create({
            requestBody: fileMetadata,
            media,
            fields: 'id, webViewLink, webContentLink',
        });

        return uploadedFile.data.id!;

    } catch (error: any) {
        console.error("[uploadToDrive] Error:", error);
        throw new Error(`Failed to upload to Drive: ${error.message}`);
    }
}

export async function uploadFileFromUrl(
    url: string,
    fileName: string,
    parentFolderId: string,
    mimeType: string = 'image/jpeg'
): Promise<string> {
    try {
        const drive = await getDriveClient();
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const fileMetadata = {
            name: fileName,
            parents: [parentFolderId],
        };

        const media = {
            mimeType,
            body: require('stream').Readable.from(buffer),
        };

        const uploadedFile = await drive.files.create({
            requestBody: fileMetadata,
            media,
            fields: 'id',
        });

        return uploadedFile.data.id!;
    } catch (error: any) {
        console.error("[uploadFileFromUrl] Error:", error);
        throw new Error(`Failed to upload from URL to Drive: ${error.message}`);
    }
}

export async function getOrCreateFolder(drive: any, name: string, parentId: string): Promise<string> {
    const response = await drive.files.list({
        q: `name = '${name}' and '${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id)',
    });

    if (response.data.files && response.data.files.length > 0) {
        return response.data.files[0].id;
    }

    return createFolder(drive, name, parentId);
}

export async function downloadFromDrive(driveFileId: string): Promise<Buffer> {
    try {
        const drive = await getDriveClient();

        const response = await drive.files.get(
            {
                fileId: driveFileId,
                alt: 'media'
            },
            { responseType: 'arraybuffer' }
        );

        return Buffer.from(response.data as ArrayBuffer);

    } catch (error: any) {
        console.error("[downloadFromDrive] Error:", error);
        throw new Error(`Failed to download from Drive: ${error.message}`);
    }
}

export async function getProductDriveFolders(productId: string) {
    const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { driveRootPath: true, driveFolderId: true }
    });

    if (!product?.driveRootPath) {
        return null;
    }

    const structure: FolderStructure = JSON.parse(product.driveRootPath as string);

    return {
        productRoot: `https://drive.google.com/drive/folders/${structure.productRootId}`,
        centroCreativo: `https://drive.google.com/drive/folders/${structure.centroCreativoId}`,
        inbox: `https://drive.google.com/drive/folders/${structure.inboxId}`,
        biblioteca: `https://drive.google.com/drive/folders/${structure.biblioteca.root}`,
    };
}
