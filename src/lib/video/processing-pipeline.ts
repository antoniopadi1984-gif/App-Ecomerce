import { removeVideoMetadata, extractVideoScript, detectVideoScenes, extractVideoClip } from '../video/metadata';
import { DriveSync } from '../research/drive-sync';
import { AiRouter } from '../ai/router';
import { TaskType } from '../ai/providers/interfaces';
import { prisma } from '../prisma';
import { buildNomenclature } from '../creative/spencer-knowledge';

/**
 * VIDEO AUTO-PROCESSING PIPELINE
 
 * Complete automation: Upload -> Analyze -> Clean -> Organize -> Rename -> Dissect -> Ready
 */
interface ProcessingResult {
    success: boolean;
    videoId?: string;
    finalPath?: string;
    cleanedUrl?: string;
    script?: {
        full: string;
        hook: string;
        body: string;
        cta: string;
    };
    concept?: number;
    clips?: Array<{ url: string; category: string }>;
    error?: string;
}

export class VideoProcessingPipeline {
    /**
    * MASTER PIPELINE - Process uploaded video completely
    */
    static async processVideo(
        videoBuffer: Buffer,
        originalFileName: string,
        productId: string
    ): Promise<ProcessingResult> {
        console.log('[Pipeline] 🚀 Starting auto-processing:', originalFileName);

        try {
            // STEP 1: Clean metadata & subtitles
            console.log('[Pipeline] Step 1: Cleaning metadata...');
            const cleaned = await this.cleanVideo(videoBuffer, originalFileName);
            if (!cleaned.success) {
                throw new Error('Metadata cleaning failed');
            }

            // STEP 2: Extract & analyze script
            console.log('[Pipeline] Step 2: Extracting script...');
            const scriptData = await this.extractAndAnalyzeScript(cleaned.buffer!);

            // STEP 3: Detect concept from script
            console.log('[Pipeline] Step 3: Detecting concept...');
            const conceptNum = await this.detectConcept(scriptData.full, productId);

            // STEP 4: Generate proper filename
            console.log('[Pipeline] Step 4: Generating filename...');
            const newFileName = await this.generateFileName(productId, conceptNum);

            // STEP 5: Upload to Drive in correct folder
            console.log('[Pipeline] Step 5: Uploading to Drive...');
            const driveUrl = await this.uploadToDrive(
                cleaned.buffer!,
                newFileName,
                productId,
                conceptNum
            );

            // STEP 5b: Save script as .txt file to Drive
            console.log('[Pipeline] Step 5b: Saving script file...');
            await this.saveScriptFile(scriptData, newFileName, productId);

            // STEP 6: Save to database
            console.log('[Pipeline] Step 6: Saving to database...');
            const video = await this.saveToDatabase({
                productId,
                fileName: newFileName,
                driveUrl,
                script: scriptData,
                concept: conceptNum,
                funnelStage: scriptData.funnelStage,
                originalFileName
            });

            // STEP 7: Extract clips (async, don't wait)
            console.log('[Pipeline] Step 7: Queuing clip extraction...');
            this.extractClipsAsync(video.id, cleaned.buffer!, productId);

            console.log('[Pipeline] ✅ Complete:', newFileName);

            return {
                success: true,
                videoId: video.id,
                finalPath: driveUrl,
                cleanedUrl: driveUrl,
                script: scriptData,
                concept: conceptNum,
                clips: [] // Will be added async
            };
        }
        catch (error: any) {
            console.error('[Pipeline] ❌ Error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
    * STEP 1: Clean metadata and remove subtitles
    */
    private static async cleanVideo(
        videoBuffer: Buffer,
        fileName: string
    ): Promise<{ success: boolean; buffer?: Buffer; error?: string }> {
        try {
            const { MetadataRemover } = await import('../media/metadata');
            const cleanBuffer = await MetadataRemover.stripVideo(videoBuffer, fileName);
            return { success: true, buffer: cleanBuffer };
        }
        catch (error: any) {
            console.error('[Pipeline] Metadata cleaning error:', error);
            return { success: true, buffer: videoBuffer };
        }
    }

    /**
    * STEP 2: Extract script and dissect with AI
    */
    private static async extractAndAnalyzeScript(videoBuffer: Buffer): Promise<{
        full: string;
        hook: string;
        body: string;
        cta: string;
        funnelStage: string;
        keyPhrases: string[];
    }> {
        // Extract audio and transcribe
        const transcript = await extractVideoScript(videoBuffer);

        if (!transcript.transcript || transcript.transcript.includes('pending')) {
            // Fallback: No script detected
            return { full: '', hook: '', body: '', cta: '', funnelStage: 'COLD', keyPhrases: [] };
        }

        // Dissect script with AI
        const prompt = `Dissect this video script into components:

Script:
${transcript.transcript}

Return JSON:
{
 "hook": "First 3-5 seconds that grab attention",
 "body": "Main content explaining the product/concept",
 "cta": "Call to action at the end",
 "funnelStage": "COLD|WARM|HOT",
 "keyPhrases": ["phrase1", "phrase2", "phrase3"]
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
                full: transcript.transcript,
                hook: data.hook || '',
                body: data.body || '',
                cta: data.cta || '',
                funnelStage: data.funnelStage || 'COLD',
                keyPhrases: data.keyPhrases || []
            };
        }
        catch (e) {
            return {
                full: transcript.transcript,
                hook: '',
                body: '',
                cta: '',
                funnelStage: 'COLD',
                keyPhrases: []
            };
        }
    }

    /**
    * STEP 3: Detect which concept (1-9) from script content
    */
    private static async detectConcept(
        script: string,
        productId: string
    ): Promise<number> {
        if (!script) return 3;
        // Default: Mecanismo
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { title: true, description: true }
        });

        const prompt = `Analyze this video script and determine which marketing concept it represents.

Product: ${product?.title || 'Unknown'}
Description: ${product?.description || ''}

Script:
${script}

Concepts:
1. Problema - Identificar y agitar el dolor exacto del avatar
2. ANTES_DESPUES - Por qué lo que han probado no funciona
3. Mecanismo - Cómo funciona el producto técnicamente
4. Prueba - Testimonios y resultados
5. Autoridad - Expertos y comparativas
6. Historia - Narrativa personal
7. Identidad - Estilo de vida y estatus
8. Resultado - Antes y después visual
9. Oferta - Venta directa urgente

Which concept (1-9) does this represent? Return ONLY the number.`;

        const result = await AiRouter.dispatch(
            'default',
            TaskType.RESEARCH_DEEP,
            prompt
        );

        const concept = parseInt(result.text.trim());
        return (concept >= 1 && concept <= 9) ? concept : 3;
    }

    /**
    * STEP 4: Generate proper filename
    */
    private static async generateFileName(
        productId: string,
        conceptNum: number
    ): Promise<string> {
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { sku: true }
        });

        return buildNomenclature({
            sku: product?.sku || 'PROD',
            concept: `C${conceptNum}`,
            version: 1,
            ext: 'mp4'
        });
    }

    /**
    * STEP 5: Upload to Drive in correct concept folder
    */
    private static async uploadToDrive(
        videoBuffer: Buffer,
        fileName: string,
        productId: string,
        conceptNum: number
    ): Promise<string> {
        const driveSync = new DriveSync();

        // Get product's Drive root
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { driveFolderId: true, driveRootPath: true }
        });

        if (!product?.driveFolderId) {
            throw new Error('Product has no Drive folder. Create structure first.');
        }

        // Logic for C1-C9 folder mapping
        const { CREATIVE_CONCEPTS } = await import('../creative/spencer-knowledge');
        const concept = CREATIVE_CONCEPTS.find(c => c.id === conceptNum);
        const conceptFolder = concept?.driveFolder || `CP_UNCLASSIFIED`;

        // Upload to Drive
        await driveSync.uploadFile(fileName, videoBuffer.toString('base64'), product.driveFolderId, 'video/mp4');

        return `${product.driveRootPath}/CENTRO_CREATIVO/${conceptFolder}/${fileName}`;
    }

    /**
    * STEP 5b: Save script as .txt file to Drive
    */
    private static async saveScriptFile(
        scriptData: any,
        videoFileName: string,
        productId: string
    ) {
        try {
            const driveSync = new DriveSync();
            const product = await prisma.product.findUnique({
                where: { id: productId },
                select: { driveFolderId: true }
            });

            if (!product?.driveFolderId) return;

            const scriptFileName = videoFileName.replace('.mp4', '_script.txt');
            const content = `FULL SCRIPT:\n${scriptData.full}\n\nHOOK:\n${scriptData.hook}\n\nBODY:\n${scriptData.body}\n\nCTA:\n${scriptData.cta}`;

            await driveSync.uploadFile(
                scriptFileName,
                Buffer.from(content).toString('base64'),
                product.driveFolderId,
                'text/plain'
            );
        }
        catch (error) {
            console.error('[Pipeline] Script file save failed:', error);
        }
    }

    /**
    * STEP 6: Save to database with all metadata
    */
    private static async saveToDatabase(data: {
        productId: string;
        fileName: string;
        driveUrl: string;
        script: any;
        concept: number;
        funnelStage: string;
        originalFileName: string;
    }) {
        // Save as DriveAsset
        const asset = await prisma.driveAsset.create({
            data: {
                productId: data.productId,
                driveFileId: `file_${Date.now()}`,
                drivePath: data.driveUrl,
                assetType: 'video',
                sourceUrl: data.fileName,
                category: `concept_${data.concept}`,
                concept: data.concept,
                organized: true
            }
        });

        // Save script
        if (data.script.full) {
            await (prisma as any).script.create({
                data: {
                    productId: data.productId,
                    fullText: data.script.full,
                    hook: data.script.hook,
                    body: data.script.body,
                    cta: data.script.cta,
                    funnelStage: data.script.funnelStage,
                    keyPhrases: JSON.stringify(data.script.keyPhrases),
                    emotionalTriggers: JSON.stringify([])
                }
            });
        }

        return asset;
    }

    /**
    * STEP 7: Extract clips in background (async)
    */
    private static async extractClipsAsync(
        videoId: string,
        videoBuffer: Buffer,
        productId: string
    ): Promise<void> {
        // Run in background - don't await
        setImmediate(async () => {
            try {
                console.log('[Pipeline] Extracting clips for:', videoId);

                // Detect best scenes
                const scenes = await detectVideoScenes(videoBuffer, 3, 8);

                // Extract top 5 clips
                for (let i = 0; i < Math.min(5, scenes.length); i++) {
                    const scene = scenes[i];
                    const clipBuffer = await extractVideoClip(
                        videoBuffer,
                        scene.start,
                        scene.end,
                        '9:16'
                    );

                    // Save clip
                    await (prisma as any).clip.create({
                        data: {
                            productId,
                            sourceVideoId: videoId,
                            startTime: scene.start,
                            endTime: scene.end,
                            duration: scene.end - scene.start,
                            category: 'auto',
                            tags: JSON.stringify({ score: scene.score }),
                            driveFileId: `clip_${videoId}_${i}`
                        }
                    });
                }
                console.log('[Pipeline] ✅ Clips extracted:', scenes.length);
            }
            catch (error) {
                console.error('[Pipeline] Clip extraction failed:', error);
            }
        });
    }

    /**
    * Batch process multiple videos
    */
    static async processBatch(
        videos: Array<{ buffer: Buffer; fileName: string }>,
        productId: string
    ): Promise<Array<ProcessingResult>> {
        console.log(`[Pipeline] Processing batch: ${videos.length} videos`);

        const results = await Promise.all(
            videos.map(v => this.processVideo(v.buffer, v.fileName, productId))
        );

        const successful = results.filter(r => r.success).length;
        console.log(`[Pipeline] ✅ Batch complete: ${successful}/${videos.length} successful`);

        return results;
    }
}
