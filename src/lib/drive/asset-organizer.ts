import { DriveSync } from '../research/drive-sync';
import { prisma } from '../prisma';
import { removeVideoMetadata } from '../video/metadata';
import { AiRouter } from '../ai/router';
import { TaskType } from '../ai/providers/interfaces';

/**
 * ASSET AUTO-ORGANIZER
 * Intelligent agent that auto-classifies and organizes files in Drive
 */

interface ClassificationResult {
    category: string;  // concept_1-7, competitive, script, clip, static_ad
    subcategory?: string;  // TikTok, Facebook, Hook, etc.
    concept?: number;  // 1-7
    confidence: number;  // 0-1
}

export class AssetOrganizer {

    /**
     * Create the full canonical folder structure for a product
     */
    async productSetup(storeId: string, productId: string, productSku: string, competitors: Record<string, unknown>[]): Promise<Record<string, unknown>> {
        console.log(`[Drive Setup] ${productId}`);

        let rootFolderId;

        // Ensure Store root exists
        const store = await prisma.store.findUnique({ where: { id: storeId } });
        if (!store) throw new Error("Store not found");

        if (store.driveRootFolderId) {
            rootFolderId = store.driveRootFolderId;
        } else {
            const res = await this.driveSync.createFolder('EcomBoom');
            const res2 = await this.driveSync.createFolder(storeId, res.id);
            rootFolderId = res2.id;
            await prisma.store.update({ where: { id: storeId }, data: { driveRootFolderId: rootFolderId } });
        }

        // Product folder
        const pFol = await this.driveSync.createFolder(productSku, rootFolderId);

        // 4_COMPETENCIA/INBOX
        const inb = await this.driveSync.createFolder('4_COMPETENCIA/INBOX', pFol.id);
        await this.driveSync.createFolder('VIDEOS', inb.id);
        await this.driveSync.createFolder('IMAGENES', inb.id);
        await this.driveSync.createFolder('LANDINGS', inb.id);
        await this.driveSync.createFolder('SPY', inb.id);
        await this.driveSync.createFolder('OTROS', inb.id);

        // 1_INVESTIGACION
        const res = await this.driveSync.createFolder('1_INVESTIGACION', pFol.id);
        await this.driveSync.createFolder('CORE', res.id);
        await this.driveSync.createFolder('AVATARES', res.id);
        await this.driveSync.createFolder('ANGULOS', res.id);
        await this.driveSync.createFolder('COMBOS', res.id);
        await this.driveSync.createFolder('VECTORES', res.id);

        // 02_SPY
        const spy = await this.driveSync.createFolder('02_SPY', pFol.id);
        for (const comp of competitors) {
            if (comp.name) {
                const compFol = await this.driveSync.createFolder(comp.name as string, spy.id);
                await this.driveSync.createFolder('ADS', compFol.id);
                await this.driveSync.createFolder('IMAGES', compFol.id);
                await this.driveSync.createFolder('LANDINGS', compFol.id);
                await this.driveSync.createFolder('WEBM', compFol.id);
            }
        }

        // 2_CREATIVOS
        const conc = await this.driveSync.createFolder('2_CREATIVOS', pFol.id);
        // We will create the dynamic folders later when concepts are generated

        // 04_PRODUCCION
        const prod = await this.driveSync.createFolder('04_PRODUCCION', pFol.id);
        for (const stage of ['TOF', 'MOF', 'BOF', 'RETARGETING']) {
            const stg = await this.driveSync.createFolder(stage, prod.id);
            await this.driveSync.createFolder('UGC', stg.id);
            await this.driveSync.createFolder('FACECAM', stg.id);
            await this.driveSync.createFolder('DEMO', stg.id);
            await this.driveSync.createFolder('STATIC', stg.id);
        }

        // 5_LANDINGS
        const lan = await this.driveSync.createFolder('5_LANDINGS', pFol.id);
        await this.driveSync.createFolder('VSL', lan.id);
        await this.driveSync.createFolder('ADVERTORIAL', lan.id);
        await this.driveSync.createFolder('LISTICLE', lan.id);
        await this.driveSync.createFolder('PRODUCT_PAGE', lan.id);

        // 06_AVATARES_IA
        const ai = await this.driveSync.createFolder('06_AVATARES_IA', pFol.id);
        await this.driveSync.createFolder('FACE_MODELS', ai.id);
        await this.driveSync.createFolder('VOICE_PROFILES', ai.id);
        await this.driveSync.createFolder('RENDERS', ai.id);

        // 07_BIBLIOTECA
        const bib = await this.driveSync.createFolder('07_BIBLIOTECA', pFol.id);
        await this.driveSync.createFolder('GANADORES', bib.id);
        await this.driveSync.createFolder('EN_TEST', bib.id);
        await this.driveSync.createFolder('ARCHIVADOS', bib.id);

        await prisma.product.update({
            where: { id: productId },
            data: { driveFolderId: pFol.id, driveRootPath: pFol.id, driveSetupDone: true }
        });

        return { id: pFol.id };
    }

    private driveSync: DriveSync;

    constructor() {
        this.driveSync = new DriveSync();
    }

    /**
     * Auto-organize a file that was uploaded to Drive
     */
    async organizeFile(
        fileId: string,
        fileName: string,
        productId: string,
        fileBuffer?: Buffer
    ): Promise<{ success: boolean; newPath?: string; error?: string }> {
        console.log(`[AssetOrganizer] Organizing: ${fileName}`);

        try {
            // 1. Classify the file
            const classification = await this.aiClassify(fileName, fileBuffer, productId);
            console.log(`[AssetOrganizer] Classification:`, classification);

            // 2. Get target folder
            const targetFolder = await this.getTargetFolder(
                productId,
                classification
            );

            // 3. Move file to target folder (if not already there)
            // TODO: Implement Drive file move
            // await this.driveSync.moveFile(fileId, targetFolder);

            // 4. Track in database
            await prisma.driveAsset.upsert({
                where: { driveFileId: fileId },
                update: {
                    category: classification.category,
                    subcategory: classification.subcategory,
                    concept: classification.concept,
                    organized: true
                },
                create: {
                    productId,
                    driveFileId: fileId,
                    assetType: this.getAssetType(fileName),
                    category: classification.category,
                    subcategory: classification.subcategory,
                    concept: classification.concept,
                    organized: true,
                    drivePath: targetFolder,
                    sourceUrl: fileName
                }
            });

            console.log(`[AssetOrganizer] ✅ Organized to: ${targetFolder}`);

            return {
                success: true,
                newPath: targetFolder
            };

        } catch (error: unknown) {
            console.error('[AssetOrganizer] Error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Classify file using AI and filename patterns
     */
    private async classifyFile(
        fileName: string,
        fileBuffer?: Buffer
    ): Promise<ClassificationResult> {

        // Strategy 1: Parse filename (IA Pro Style: [DATE]_[BRAND]_[ANGLE]_[HOOK]_[VAR])
        const spencerMatch = fileName.match(/^(\d{6})_([^_]*)_([^_]*)_([^_]*)_([^_]*)/i);
        if (spencerMatch) {
            return {
                category: 'creative_asset',
                subcategory: spencerMatch[3], // Angle
                confidence: 0.99
            };
        }

        // Strategy 1.1: Legacy patterns (NAD_C3_V12.mp4 → Concept 3)
        const filenameMatch = fileName.match(/_C(\d)_V?\d*/i);
        if (filenameMatch) {
            const concept = parseInt(filenameMatch[1]);
            if (concept >= 1 && concept <= 7) {
                return {
                    category: `concept_${concept}`,
                    concept,
                    confidence: 0.95
                };
            }
        }

        // Strategy 2: Keywords in filename
        const keywords = {
            competitive: ['competitor', 'tiktok', 'facebook', 'youtube', 'ad_library'],
            script: ['script', 'copy', 'guion'],
            clip: ['clip', 'extract', 'segment'],
            static: ['static', 'image', 'banner', 'creative']
        };

        const lowerName = fileName.toLowerCase();
        for (const [category, words] of Object.entries(keywords)) {
            if (words.some(w => lowerName.includes(w))) {
                const result: ClassificationResult = {
                    category,
                    confidence: 0.7
                };

                // Detect platform for competitive
                if (category === 'competitive') {
                    if (lowerName.includes('tiktok')) result.subcategory = 'TikTok';
                    else if (lowerName.includes('facebook') || lowerName.includes('meta')) result.subcategory = 'Facebook';
                    else if (lowerName.includes('youtube')) result.subcategory = 'YouTube';
                    else result.subcategory = 'Others';
                }

                return result;
            }
        }

        // Strategy 3: AI Classification (if buffer provided)
        if (fileBuffer) {
            try {
                const classification = await this.aiClassify(fileName, fileBuffer);
                return classification;
            } catch (e) {
                console.warn('[AssetOrganizer] AI classification failed:', e);
            }
        }

        // Default: unorganized
        return {
            category: 'unorganized',
            confidence: 0
        };
    }

    /**
     * Use AI to classify file based on content
     */
    private async aiClassify(
        fileName: string,
        fileBuffer?: Buffer,
        productId?: string
    ): Promise<ClassificationResult> {
        let researchContext = "";
        if (productId) {
            try {
                const latestResearch = await prisma.researchRun.findFirst({
                    where: { productId, status: 'READY' },
                    orderBy: { createdAt: 'desc' }
                });
                if (latestResearch && latestResearch.results) {
                    const data = JSON.parse(latestResearch.results as string);
                    researchContext = `CONOCIMIENTO ESTRATÉGICO:\nÁngulos: ${JSON.stringify(data.marketing_angles || {})}`;
                }
            } catch (e) {
                console.warn('[AssetOrganizer] Error fetching research context:', e);
            }
        }

        const prompt = `Classify this file for marketing asset organization using SPENCER PAWLIN standards.
        
${researchContext}

Filename: ${fileName}

Categories:
- creative_asset: Final ad/creative (matches spencer nomenclature)
- concept_1: Problema (pain points)
- concept_2: Solucion (solution presentation)
- concept_3: Mecanismo (how it works, unique mechanism)
- concept_4: Prueba (testimonials, proof, results)
- concept_5: Autoridad (credentials, experts, certifications)
- concept_6: Estatus (social transformation, lifestyle)
- concept_7: Resultado (final result, CTA)
- competitive: Competitor content
- script: Script/copy text
- clip: Short video clip
- static: Static ad/image

If the filename follows [DATE]_[BRAND]_[ANGLE]_[HOOK]_[VAR], it is a 'creative_asset'.

Based on the filename and strategic context, what category is this? 

Return JSON:
{
  "category": "creative_asset",
  "concept": null,
  "subcategory": "ANGLE_NAME",
  "confidence": 0.8,
  "reasoning": "Fits IA nomenclature and matches strategic research"
}`;

        const result = await AiRouter.dispatch(
            'default',
            TaskType.RESEARCH_DEEP,
            prompt,
            { jsonSchema: true }
        );

        try {
            const data = JSON.parse(result.text);
            return {
                category: data.category,
                subcategory: data.subcategory,
                concept: data.concept,
                confidence: data.confidence || 0.6
            };
        } catch (e) {
            return { category: 'unorganized', confidence: 0 };
        }
    }

    /**
     * Get target folder path for classification
     */
    private async getTargetFolder(
        productId: string,
        classification: ClassificationResult
    ): Promise<string> {

        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { driveRootPath: true }
        });

        if (!product?.driveRootPath) {
            throw new Error('Product has no Drive root path');
        }

        const base = product.driveRootPath || '';

        // Map category to folder structure
        if (classification.category.startsWith('concept_')) {
            const concept = classification.concept || 1;
            const conceptNames = [
                'Problema', 'Solucion', 'Mecanismo', 'Prueba',
                'Autoridad', 'Estatus', 'Resultado'
            ];
            return `${base}/04_CREATIVOS/04_CONCEPTOS/${concept}-${conceptNames[concept - 1]}`;
        }

        if (classification.category === 'competitive') {
            const platform = classification.subcategory || 'Others';
            return `${base}/09_COMPETENCIA/${platform}`;
        }

        if (classification.category === 'script') {
            return `${base}/08_SCRIPTS/Complete`;
        }

        if (classification.category === 'clip') {
            return `${base}/04_CREATIVOS/01_CLIPS`;
        }

        if (classification.category === 'static') {
            return `${base}/10_STATIC_ADS/Generated`;
        }

        // Default: admin folder
        return `${base}/00_ADMIN`;
    }

    /**
     * Batch organize all unorganized files for a product
     */
    async organizeAllUnorganized(productId: string): Promise<{
        total: number;
        organized: number;
        failed: number;
    }> {
        console.log(`[AssetOrganizer] Organizing all unorganized files for product: ${productId}`);

        const unorganized = await prisma.driveAsset.findMany({
            where: {
                productId,
                organized: false
            }
        });

        let organized = 0;
        let failed = 0;

        for (const asset of unorganized) {
            const result = await this.organizeFile(
                asset.driveFileId,
                asset.sourceUrl || 'unnamed',
                productId
            );

            if (result.success) organized++;
            else failed++;
        }

        console.log(`[AssetOrganizer] ✅ Done: ${organized} organized, ${failed} failed`);

        return {
            total: unorganized.length,
            organized,
            failed
        };
    }

    /**
     * Auto-detect concept from video content using AI
     */
    async detectConceptFromVideo(
        videoBuffer: Buffer,
        productContext: string
    ): Promise<number> {

        const prompt = `Analyze this video and determine which marketing concept it represents for product: ${productContext}

Concepts:
1. Problema - Shows customer pain points, problems, frustrations
2. Solucion - Presents the product as the solution
3. Mecanismo - Explains unique mechanism, how it works differently
4. Prueba - Testimonials, before/after, proof of results
5. Autoridad - Expert endorsements, credentials, certifications
6. Estatus - Social transformation, lifestyle upgrade
7. Resultado - Final result, strong CTA, urgency

Based on the video filename and context, which concept (1-7) does this represent?

Return only the number 1-7.`;

        const result = await AiRouter.dispatch(
            'default',
            TaskType.RESEARCH_DEEP,
            prompt
        );

        const concept = parseInt(result.text.trim());
        return (concept >= 1 && concept <= 7) ? concept : 3; // Default to Mecanismo
    }

    /**
     * Helper: Get asset type from filename
     */
    private getAssetType(fileName: string): string {
        const ext = fileName.split('.').pop()?.toLowerCase();

        const videoExts = ['mp4', 'mov', 'avi', 'webm', 'mkv'];
        const imageExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
        const docExts = ['pdf', 'doc', 'docx', 'txt', 'md'];

        if (videoExts.includes(ext || '')) return 'video';
        if (imageExts.includes(ext || '')) return 'image';
        if (docExts.includes(ext || '')) return 'document';

        return 'unknown';
    }
}
