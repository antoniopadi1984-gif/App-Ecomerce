import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../prisma";

const ROOT_FOLDER_NAME = "Ecombom Control";
const PRODUCTS_FOLDER_NAME = "01_PRODUCTOS";
const INBOX_FOLDER_NAME = "03_INBOX_CAPTURAS_EXTENSION";

// Note: Ensure `npx prisma generate` is run if type errors persist regarding driveAsset or driveFolderId.
export class DriveSync {
    private client: any;
    private _drive: any;
    private accessToken?: string;
    private refreshToken?: string;

    constructor(accessToken?: string, refreshToken?: string, clientId?: string, clientSecret?: string) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        // If tokens provided, we can pre-init for legacy compat, but we prefer lazy loading now to check DB
        if (accessToken) {
            const oauth2Client = new google.auth.OAuth2(
                clientId || process.env.GOOGLE_OAUTH_CLIENT_ID,
                clientSecret || process.env.GOOGLE_OAUTH_CLIENT_SECRET
            );
            oauth2Client.setCredentials({
                access_token: accessToken,
                refresh_token: refreshToken
            });
            this.client = oauth2Client;
            // We don't init this._drive here immediately if we want to prioritize SA, 
            // BUT if tokens are passed explicitly, we usually intend to use them.
            // Let's assume: Explicit keys > Service Account > Legacy Env
            this._drive = google.drive({ version: "v3", auth: oauth2Client });
        }
    }

    private async getDrive() {
        if (this._drive) return this._drive;

        // Try Service Account
        try {
            // Used to dynamically import, but now using top-level import to avoid TS errors
            const sa = await prisma.connection.findFirst({
                where: { provider: "GOOGLE_SERVICE_ACCOUNT", isActive: true }
            });

            if (sa && sa.extraConfig) {
                const credentials = JSON.parse(sa.extraConfig as string);
                const auth = new google.auth.GoogleAuth({
                    credentials,
                    scopes: ['https://www.googleapis.com/auth/drive']
                });
                const client = await auth.getClient();
                this._drive = google.drive({ version: "v3", auth: client as any });
                return this._drive;
            }
        } catch (e) {
            console.warn("Failed to load Service Account for Drive:", e);
        }

        if (this.client) {
            this._drive = google.drive({ version: "v3", auth: this.client });
            return this._drive;
        }

        throw new Error("No valid authentication for Google Drive.");
    }

    /**
     * Ensures ECOMBOM_CONTROL and 01_PRODUCTOS exist.
     * Returns the ID of 01_PRODUCTOS.
     */
    async ensureSystemRoot(): Promise<{ rootId: string, productsId: string, inboxId: string }> {
        const rootId = await this.findOrCreateFolder(ROOT_FOLDER_NAME);
        const productsId = await this.findOrCreateFolder(PRODUCTS_FOLDER_NAME, rootId);
        const inboxId = await this.findOrCreateFolder(INBOX_FOLDER_NAME, rootId);
        return { rootId, productsId, inboxId };
    }

    /**
     * Creates the strict product folder structure.
     * Format: [PAIS]__[SLUG]__[YYYY-MM]
     */
    async createProductStructure(productId: string, productName: string, country: string = "ES"): Promise<Record<string, string>> {
        const { productsId } = await this.ensureSystemRoot();

        // Slugify name
        const slug = productName.toUpperCase().replace(/[^A-Z0-9]/g, "_");
        const date = new Date().toISOString().slice(0, 7); // YYYY-MM
        const folderName = `${country}__${slug}__${date}`;

        // 1. Product Root
        const productRootId = await this.findOrCreateFolder(folderName, productsId);

        // 2. USER-REQUESTED Structure
        const structure: any = {
            "RESEARCH": [],
            "CREATIVOS_PROPIOS": [
                "CLIPS",
                "CONCEPTOS/Problema",
                "CONCEPTOS/Solucion",
                "CONCEPTOS/Mecanismo",
                "CONCEPTOS/Prueba",
                "CONCEPTOS/Autoridad",
                "CONCEPTOS/Estatus",
                "CONCEPTOS/Resultado",
                "SCRIPTS",
                "WINNER"
            ],
            "COMPETENCIA_MANUAL": [], // Tus videos de competidores subidos manualmente
            "COMPETENCIA_META": [],    // Videos de Meta Ads Library (auto)
            "COMPETENCIA_TIKTOK": []   // Videos de TikTok Library (auto)
        };

        const folderMap: Record<string, string> = { root: productRootId };

        for (const [folder, subs] of Object.entries(structure)) {
            const folderId = await this.findOrCreateFolder(folder, productRootId);
            folderMap[folder] = folderId;

            // Track Main Folders as Assets? Maybe not needed, but good for reference.
            await this.trackAsset(productId, folderId, folder, "FOLDER", folder);

            if (Array.isArray(subs) && subs.length > 0) {
                for (const sub of subs) {
                    if (sub.includes("/")) {
                        // Nested path like 03_EXPORTS/9x16
                        const parts = sub.split("/");
                        let parent = folderId;
                        let currentPath = folder;
                        for (const part of parts) {
                            parent = await this.findOrCreateFolder(part, parent);
                            folderMap[part] = parent; // Note: this might override if names are same, but for ECOMBOM it's fine
                            currentPath += `/${part}`;
                            await this.trackAsset(productId, parent, currentPath, "FOLDER", currentPath);
                        }
                    } else {
                        const subId = await this.findOrCreateFolder(sub, folderId);
                        folderMap[sub] = subId;
                        await this.trackAsset(productId, subId, `${folder}/${sub}`, "FOLDER", `${folder}/${sub}`);
                    }
                }
            }
        }

        console.log(`[DriveSync] Structure Ensure for ${folderName} (${productRootId})`);

        // Update Product with Root Path info for UI display
        await prisma.product.update({
            where: { id: productId },
            data: {
                driveFolderId: productRootId,
                driveRootPath: `${ROOT_FOLDER_NAME}/${PRODUCTS_FOLDER_NAME}/${folderName}`
            }
        });

        return folderMap;
    }

    
    /**
     * Helper to simply create a folder with a name and optional parent 
     * (wraps findOrCreateFolder for API compatibility with AssetOrganizer)
     */
    async createFolder(name: string, parentId?: string): Promise<{id: string}> {
        const id = await this.findOrCreateFolder(name, parentId);
        return { id };
    }

    private async findOrCreateFolder(name: string, parentId?: string): Promise<string> {
        console.log(`[DriveSync] findOrCreateFolder: "${name}" parent=${parentId || 'root'}`);

        const query = `mimeType='application/vnd.google-apps.folder' and name='${name}' and trashed=false ${parentId ? `and '${parentId}' in parents` : ''}`;

        const drive = await this.getDrive();
        console.log(`[DriveSync] Querying Drive with: ${query.substring(0, 100)}...`);

        const res = await drive.files.list({
            q: query,
            fields: "files(id, name)",
            spaces: "drive",
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        });

        if (res.data.files && res.data.files.length > 0) {
            console.log(`[DriveSync] Found existing folder: ${res.data.files[0].id}`);
            return res.data.files[0].id!;
        }

        console.log(`[DriveSync] Creating new folder: "${name}"`);
        const file = await drive.files.create({
            requestBody: {
                name,
                mimeType: "application/vnd.google-apps.folder",
                parents: parentId ? [parentId] : undefined
            },
            fields: "id",
            supportsAllDrives: true
        });

        console.log(`[DriveSync] Created folder: ${file.data.id}`);
        return file.data.id!;
    }

    private async trackAsset(productId: string, fileId: string, path: string, type: string, name: string) {
        // Idempotent upsert
        await prisma.driveAsset.upsert({
            where: { driveFileId: fileId },
            update: { drivePath: path },
            create: {
                productId,
                driveFileId: fileId,
                drivePath: path,
                assetType: type,
                sourceUrl: name // storing name as source/ref
            }
        });
    }
    async uploadFile(name: string, content: string, folderId: string, mimeType: string = 'text/markdown') {
        try {
            const drive = await this.getDrive();
            await drive.files.create({
                requestBody: {
                    name,
                    parents: [folderId],
                    mimeType
                },
                media: {
                    mimeType,
                    body: content
                },
                supportsAllDrives: true
            });
            return { success: true };
        } catch (error: any) {
            console.error("[DriveUpload Error]", error);
            throw error;
        }
    }
}
