import { buildNomenclature, getDrivePath, CREATIVE_CONCEPTS } from './spencer-knowledge';
import { prisma } from '../prisma';
import { SemanticIndexService } from '../services/semantic-index-service';
import { AiRouter } from '../ai/router';
import { TaskType } from '../ai/providers/interfaces';
import { GoogleSheetsService } from '../google-sheets';

/**
 * BULK UPLOAD PIPELINE
 * 
 * Orchestrator that wraps VideoProcessingPipeline + AdvancedVideoClassifier
 * and adds: IA nomenclature, Sheets logging, image handling, 
 * and Drive organization by store/product/concept.
 * 
 * Handles both VIDEO and IMAGE files.
 * Same entry point for: manual upload, extension capture (Foreplay/ImageEye), batch.
 */

export interface BulkUploadResult {
    success: boolean;
    fileName: string;
    type: 'VIDEO' | 'IMAGE';
    nomenclatura?: string;
    concept?: number;
    conceptName?: string;
    audienceType?: string;
    awarenessLevel?: string;
    funnelStage?: string;
    drivePath?: string;
    sheetRowId?: string;
    assetId?: string;
    clips?: number;
    error?: string;
}

const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'];

export class BulkUploadPipeline {

    /**
     * Process a single file (auto-detect type)
     */
    static async processFile(params: {
        buffer: Buffer;
        fileName: string;
        productId: string;
        storeId: string;
        source?: 'UPLOAD' | 'EXTENSION_VIDEO' | 'EXTENSION_IMAGE';
        isCompetitor?: boolean;
    }): Promise<BulkUploadResult> {

        const ext = '.' + params.fileName.split('.').pop()?.toLowerCase();

        if (VIDEO_EXTENSIONS.includes(ext)) {
            return this.processVideo(params);
        } else if (IMAGE_EXTENSIONS.includes(ext)) {
            return this.processImage(params);
        } else {
            return {
                success: false,
                fileName: params.fileName,
                type: 'IMAGE',
                error: `Unsupported file type: ${ext}`,
            };
        }
    }

    /**
     * Process a video through the full pipeline:
     * Strip → STT → Classify C1-C7 → Clips → Nomenclature → Drive → Sheets
     */
    static async processVideo(params: {
        buffer: Buffer;
        fileName: string;
        productId: string;
        storeId: string;
        source?: string;
        isCompetitor?: boolean;
    }): Promise<BulkUploadResult> {

        console.log(`[BulkPipeline] 🎬 Processing video: ${params.fileName}`);
        const startTime = Date.now();

        try {
            // Import dynamically to avoid circular dependencies
            const { VideoProcessingPipeline } = await import('../video/processing-pipeline');
            const { AdvancedVideoClassifier } = await import('../video/advanced-classifier');

            // 1. Use existing VideoProcessingPipeline (strip → STT → concept → drive → DB)
            const pipelineResult = await VideoProcessingPipeline.processVideo(
                params.buffer,
                params.fileName,
                params.productId
            );

            if (!pipelineResult.success) {
                throw new Error(pipelineResult.error || 'Pipeline failed');
            }

            // 2. Run AdvancedVideoClassifier for full classification (C1-C7 + audience + awareness)
            let classification = null;
            if (pipelineResult.script?.full) {
                const product = await prisma.product.findUnique({
                    where: { id: params.productId },
                    select: { title: true, description: true },
                });
                classification = await AdvancedVideoClassifier.classifyVideo(
                    pipelineResult.script.full,
                    `${product?.title || ''}: ${product?.description || ''}`
                );
            }

            // 3. Generate IA nomenclature
            const conceptCode = `C${classification?.concept || pipelineResult.concept || 3}`;
            const conceptData = CREATIVE_CONCEPTS.find(c => c.code === conceptCode);

            const product = await prisma.product.findUnique({
                where: { id: params.productId },
                select: { sku: true },
            });

            const ext = params.fileName.split('.').pop()?.toLowerCase() || 'mp4';

            const nomenclatura = buildNomenclature({
                sku: product?.sku || 'PROD',
                concept: conceptCode,
                version: (pipelineResult as any).version || 1,
                ext: ext
            });

            // 4. Update asset in DB with full classification
            if (pipelineResult.videoId && classification) {
                await (prisma as any).driveAsset.update({
                    where: { id: pipelineResult.videoId },
                    data: {
                        concept: classification.concept,
                        category: `C${classification.concept}_${conceptData?.name || 'Concept'}`,
                    },
                });
            }

            // 5. Log to Google Sheets
            const processingTime = `${((Date.now() - startTime) / 1000).toFixed(1)}s`;
            try {
                await GoogleSheetsService.logVideoMetrics({
                    productName: (await prisma.product.findUnique({ where: { id: params.productId }, select: { title: true } }))?.title || '',
                    videoName: nomenclatura,
                    concept: classification?.concept || pipelineResult.concept || 3,
                    awarenessLevel: classification?.awarenessLevel || 'PROBLEM_AWARE',
                    funnelStage: classification?.funnelStage || 'TOP',
                    processingTime,
                    scriptLength: pipelineResult.script?.full?.length,
                });
            } catch (sheetError) {
                console.warn('[BulkPipeline] Sheets logging failed (non-critical):', sheetError);
            }

            console.log(`[BulkPipeline] ✅ Video complete: ${nomenclatura} (${processingTime})`);

            if (pipelineResult.videoId) {
                // Background indexing
                SemanticIndexService.indexCreativeAsset(pipelineResult.videoId).catch((e: any) => console.error("[BulkPipeline] Index error:", e));
            }

            return {
                success: true,
                fileName: params.fileName,
                type: 'VIDEO',
                nomenclatura,
                concept: classification?.concept || pipelineResult.concept,
                conceptName: conceptData?.name,
                audienceType: classification?.audienceType,
                awarenessLevel: classification?.awarenessLevel,
                funnelStage: classification?.funnelStage,
                drivePath: pipelineResult.finalPath,
                assetId: pipelineResult.videoId,
                clips: pipelineResult.clips?.length || 0,
            };

        } catch (error: any) {
            console.error(`[BulkPipeline] ❌ Video error:`, error);
            return {
                success: false,
                fileName: params.fileName,
                type: 'VIDEO',
                error: error.message,
            };
        }
    }

    /**
     * Process an image: WebP optimize → Drive → DB
     */
    static async processImage(params: {
        buffer: Buffer;
        fileName: string;
        productId: string;
        storeId: string;
        source?: string;
        isCompetitor?: boolean;
    }): Promise<BulkUploadResult> {
        try {
            const { MetadataRemover } = await import('../media/metadata');
            const cleanBuffer = await MetadataRemover.stripImage(params.buffer);

            const product = await prisma.product.findUnique({
                where: { id: params.productId },
                select: { sku: true },
            });

            const nomenclatura = buildNomenclature({
                sku: product?.sku || 'PROD',
                concept: 'C3', // Default concept for images if not specified
                version: 1,
                ext: 'webp'
            });

            const asset = await (prisma as any).creativeAsset.create({
                data: {
                    storeId: params.storeId,
                    productId: params.productId,
                    name: nomenclatura,
                    nomenclatura,
                    type: 'IMAGE',
                    status: 'ACTIVO',
                    source: params.source || 'UPLOAD',
                    isCompetitor: params.isCompetitor || false,
                },
            });

            return {
                success: true,
                fileName: params.fileName,
                type: 'IMAGE',
                nomenclatura,
                assetId: asset.id,
            };
        } catch (error: any) {
            console.error('[BulkPipeline] Image error:', error);
            return {
                success: false,
                fileName: params.fileName,
                type: 'IMAGE',
                error: error.message,
            };
        }
    }

    /**
     * Process multiple files in batch
     */
    static async processBatch(params: {
        files: Array<{ buffer: Buffer; fileName: string }>;
        productId: string;
        storeId: string;
        source?: 'UPLOAD' | 'EXTENSION_VIDEO' | 'EXTENSION_IMAGE';
        isCompetitor?: boolean;
    }): Promise<{
        results: BulkUploadResult[];
        summary: { total: number; success: number; failed: number; videos: number; images: number };
    }> {

        console.log(`[BulkPipeline] 🚀 Processing batch: ${params.files.length} files`);
        const startTime = Date.now();

        const results = await Promise.allSettled(
            params.files.map(file =>
                this.processFile({
                    buffer: file.buffer,
                    fileName: file.fileName,
                    productId: params.productId,
                    storeId: params.storeId,
                    source: params.source,
                    isCompetitor: params.isCompetitor,
                })
            )
        );

        const processedResults: BulkUploadResult[] = results.map((r, i) => {
            if (r.status === 'fulfilled') return r.value;
            return {
                success: false,
                fileName: params.files[i].fileName,
                type: 'VIDEO' as const,
                error: r.reason?.message || 'Unknown error',
            };
        });

        const summary = {
            total: processedResults.length,
            success: processedResults.filter(r => r.success).length,
            failed: processedResults.filter(r => !r.success).length,
            videos: processedResults.filter(r => r.type === 'VIDEO' && r.success).length,
            images: processedResults.filter(r => r.type === 'IMAGE' && r.success).length,
        };

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`[BulkPipeline] ✅ Batch complete: ${summary.success}/${summary.total} success (${duration}s)`);

        return { results: processedResults, summary };
    }
}
