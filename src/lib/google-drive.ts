import { google } from "googleapis";
import { prisma } from "./prisma";
import { getConnectionSecret } from '@/lib/server/connections';
import { getGoogleAuth } from './google-auth';

/**
 * DRIVE STRUCTURE MANAGER
 * Auto-creates comprehensive folder structure for each product
 */

async function getDriveClient() {
    const auth = await getGoogleAuth('store-main');
    return google.drive({ version: "v3", auth });
}

async function getDocsClient() {
    const auth = await getAuthClient();
    return google.docs({ version: "v1", auth });
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

async function createGoogleDoc(
    docs: any,
    drive: any,
    title: string,
    content: string,
    parentFolderId: string
): Promise<string> {
    // Create blank doc
    const doc = await docs.documents.create({
        requestBody: {
            title
        }
    });

    const docId = doc.data.documentId;

    // Move to folder
    await drive.files.update({
        fileId: docId,
        addParents: parentFolderId,
        fields: 'id, parents'
    });

    // Insert content
    if (content) {
        await docs.documents.batchUpdate({
            documentId: docId,
            requestBody: {
                requests: [
                    {
                        insertText: {
                            location: { index: 1 },
                            text: content
                        }
                    }
                ]
            }
        });
    }

    return docId;
}

interface FolderStructure {
    productRootId: string;
    research: string;
    videos: {
        root: string;
        raw: string;
        analyzed: string;
        variations: string;
    };
    statics: {
        root: string;
        generated: string;
        approved: string;
        userUploads: string; // Para creativos que sube el usuario
    };
    images: {
        root: string;
        landing: string;      // Imágenes para landing pages
        advertorial: string;  // Imágenes para advertorials
        listicle: string;     // Imágenes para listicles
        product: string;      // Imágenes del producto
        competitors: string;  // Imágenes de competencia
    };
    scripts: string;
    landings: {
        root: string;
        versions: string;
        screenshots: string;
    };
    competitors: {
        root: string;
        pages: string;
        ads: string;
    };
    performance: string;
    clips: string; // Para clips extraídos y seleccionados
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
        const docs = await getDocsClient();

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
            productRootId = await createFolder(drive, productTitle, rootFolderId);

            await prisma.product.update({
                where: { id: productId },
                data: { driveFolderId: productRootId }
            });
        }

        console.log(`📁 Creating structure for: ${productTitle}`);

        // 01_Research
        const researchId = await createFolder(drive, "01_Research", productRootId);

        // 02_Videos
        const videosRootId = await createFolder(drive, "02_Videos", productRootId);
        const videosRawId = await createFolder(drive, "Raw_Uploads", videosRootId);
        const videosAnalyzedId = await createFolder(drive, "Analyzed_Clips", videosRootId);
        const videosVariationsId = await createFolder(drive, "Variations", videosRootId);

        // 03_Statics
        const staticsRootId = await createFolder(drive, "03_Statics", productRootId);
        const staticsGeneratedId = await createFolder(drive, "Generated", staticsRootId);
        const staticsApprovedId = await createFolder(drive, "Approved", staticsRootId);
        const staticsUserUploadsId = await createFolder(drive, "User_Uploads", staticsRootId);

        // 04_Images (NEW: Imágenes optimizadas para landing/advertorial/listicle)
        const imagesRootId = await createFolder(drive, "04_Images", productRootId);
        const imagesLandingId = await createFolder(drive, "Landing", imagesRootId);
        const imagesAdvertorialId = await createFolder(drive, "Advertorial", imagesRootId);
        const imagesListicleId = await createFolder(drive, "Listicle", imagesRootId);
        const imagesProductId = await createFolder(drive, "Product", imagesRootId);
        const imagesCompetitorsId = await createFolder(drive, "Competitors", imagesRootId);

        // 05_Scripts
        const scriptsId = await createFolder(drive, "05_Scripts", productRootId);

        // 06_Landings
        const landingsRootId = await createFolder(drive, "06_Landings", productRootId);
        const landingsVersionsId = await createFolder(drive, "Versions", landingsRootId);
        const landingsScreenshotsId = await createFolder(drive, "Screenshots", landingsRootId);

        // 07_Competitors
        const competitorsRootId = await createFolder(drive, "07_Competitors", productRootId);
        const competitorsPagesId = await createFolder(drive, "Pages", competitorsRootId);
        const competitorsAdsId = await createFolder(drive, "Ads", competitorsRootId);

        // 08_Performance
        const performanceId = await createFolder(drive, "08_Performance", productRootId);

        // 09_Selected_Clips
        const clipsId = await createFolder(drive, "09_Selected_Clips", productRootId);

        // Create placeholder Google Docs in Research folder
        await createGoogleDoc(
            docs,
            drive,
            "Product_DNA",
            `# Product DNA - ${productTitle}\n\nPending research completion...`,
            researchId
        );

        await createGoogleDoc(
            docs,
            drive,
            "Truth_Layer_Evidence",
            `# Truth Layer Evidence - ${productTitle}\n\nPending research completion...`,
            researchId
        );

        await createGoogleDoc(
            docs,
            drive,
            "VOC_Language_Bank",
            `# Voice of Customer Language - ${productTitle}\n\nPending research completion...`,
            researchId
        );

        await createGoogleDoc(
            docs,
            drive,
            "Marketing_Angles",
            `# Marketing Angles - ${productTitle}\n\nPending research completion...`,
            researchId
        );

        const structure: FolderStructure = {
            productRootId,
            research: researchId,
            videos: {
                root: videosRootId,
                raw: videosRawId,
                analyzed: videosAnalyzedId,
                variations: videosVariationsId,
            },
            statics: {
                root: staticsRootId,
                generated: staticsGeneratedId,
                approved: staticsApprovedId,
                userUploads: staticsUserUploadsId,
            },
            images: {
                root: imagesRootId,
                landing: imagesLandingId,
                advertorial: imagesAdvertorialId,
                listicle: imagesListicleId,
                product: imagesProductId,
                competitors: imagesCompetitorsId,
            },
            scripts: scriptsId,
            landings: {
                root: landingsRootId,
                versions: landingsVersionsId,
                screenshots: landingsScreenshotsId,
            },
            competitors: {
                root: competitorsRootId,
                pages: competitorsPagesId,
                ads: competitorsAdsId,
            },
            performance: performanceId,
            clips: clipsId,
        };

        // Save structure to product
        await prisma.product.update({
            where: { id: productId },
            data: {
                driveRootPath: JSON.stringify(structure)
            }
        });

        console.log(`✅ Drive structure created for ${productTitle}`);
        return structure;

    } catch (error: any) {
        console.error("[createProductDriveStructure] Error:", error);
        throw new Error(`Failed to create Drive structure: ${error.message}`);
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
    targetFolder: 'videos-raw' | 'statics-user' | 'clips' | 'scripts' | 'images-landing' | 'images-advertorial' | 'images-listicle' | 'images-product' | 'images-competitors'
): Promise<string> {
    try {
        const drive = await getDriveClient();

        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { driveRootPath: true }
        });

        if (!product?.driveRootPath) {
            throw new Error("Product Drive structure not created");
        }

        const structure: FolderStructure = JSON.parse(product.driveRootPath as string);

        let parentId: string;
        switch (targetFolder) {
            case 'videos-raw':
                parentId = structure.videos.raw;
                break;
            case 'statics-user':
                parentId = structure.statics.userUploads;
                break;
            case 'clips':
                parentId = structure.clips;
                break;
            case 'scripts':
                parentId = structure.scripts;
                break;
            case 'images-landing':
                parentId = structure.images.landing;
                break;
            case 'images-advertorial':
                parentId = structure.images.advertorial;
                break;
            case 'images-listicle':
                parentId = structure.images.listicle;
                break;
            case 'images-product':
                parentId = structure.images.product;
                break;
            case 'images-competitors':
                parentId = structure.images.competitors;
                break;
            default:
                throw new Error("Invalid target folder");
        }

        const fileMetadata = {
            name: fileName,
            parents: [parentId],
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

/**
 * Download file from Drive
 */
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

/**
 * Get Drive folder URLs for UI
 */
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
        videosRaw: `https://drive.google.com/drive/folders/${structure.videos.raw}`,
        staticsUser: `https://drive.google.com/drive/folders/${structure.statics.userUploads}`,
        clips: `https://drive.google.com/drive/folders/${structure.clips}`,
        scripts: `https://drive.google.com/drive/folders/${structure.scripts}`,
    };
}
