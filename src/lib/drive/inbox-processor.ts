import { prisma } from '../prisma';
import { DriveSync } from '../research/drive-sync';

interface FileAnalysis {
    confidence: number;
    recommendedPath: string;
    newName: string;
    metadata: {
        hook?: string;
        emocion?: string;
        framework?: string;
        embudo?: string;
        avatar?: string;
        angulo?: string;
        duracion?: string;
        tipo?: string;
        ratio?: string;
        score?: number;
    };
    needsManualReview: boolean;
}

/**
 * Inbox Processor Agent (Bloque 4)
 * Procesa automáticamente archivos del INBOX de Drive.
 */
export class InboxProcessor {
    private driveSync: DriveSync;

    constructor() {
        this.driveSync = new DriveSync();
    }

    /**
     * Entry point to process the Inbox for a whole product
     */
    async processProductInbox(productId: string) {
        console.log(`[InboxProcessor] Iniciando proceso INBOX para: ${productId}`);

        // 1. Get inbox files for this product from DB
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { sku: true, driveFolderId: true }
        });

        if (!product || !product.driveFolderId) {
            throw new Error(`Producto ${productId} sin estructura de carpetas configurada.`);
        }

        const inboxFiles = await prisma.driveAsset.findMany({
            where: {
                productId,
                drivePath: { startsWith: 'INBOX' }, // We assume path indicates inbox state
                organized: false
            }
        });

        const results = [];

        for (const file of inboxFiles) {
            try {
                // Actual file content downloading would happen here via Google Drive API
                // We'll mock the buffer part for the architectural flow

                // Step 1: Limpiar metadata si es video/imagen
                // const cleanBuffer = await removeVideoMetadata(downloadedBuffer, file.assetType);

                // Step 2: Analizar con Gemini Vision
                console.log(`[InboxProcessor] Analizando ${file.sourceUrl} con Gemini Vision...`);
                // const analysis = await this.analyzeWithGeminiVision(cleanBuffer, file.assetType, product.sku || 'PROD');
                const analysis: FileAnalysis = await this.mockAnalyzeFile(file.sourceUrl || '', file.assetType, product.sku || 'PROD'); // Temporary Mock

                // Step 5: Separar en clips si es un vídeo largo (> 30s)
                // if (file.assetType === 'video' && Number(analysis.metadata.duracion) > 30) {
                //      const clips = await extractVideoClips(cleanBuffer);
                //      for (const clip of clips) { ... analyze and track clip ... }
                // }

                // Check Confidence
                if (analysis.confidence < 0.70 || analysis.needsManualReview) {
                    console.log(`[InboxProcessor] Confianza baja (${Math.round(analysis.confidence * 100)}%), requiere revisión manual.`);
                    await prisma.driveAsset.update({
                        where: { id: file.id },
                        data: {
                            category: 'manual_review',
                            organized: false, // Remains false
                            metadata: JSON.stringify(analysis.metadata)
                        }
                    });
                    results.push({ id: file.id, status: 'manual_review', confidence: analysis.confidence });
                    continue; // Skip moving
                }

                // Step 3 & 4: Renombrar y mover (Spencer Pawlin Style)
                console.log(`[InboxProcessor] Moviendo a: ${analysis.recommendedPath}/${analysis.newName}`);

                // Real Drive API call to move and rename would go here:
                // await this.driveSync.moveFile(file.driveFileId, analysis.recommendedPath, analysis.newName);

                // Step 6: Guardar en DB con todos los metatados
                await prisma.driveAsset.update({
                    where: { id: file.id },
                    data: {
                        sourceUrl: analysis.newName, // Updating source url as new name
                        drivePath: analysis.recommendedPath,
                        organized: true,
                        category: analysis.metadata.tipo || 'creative_asset',
                        metadata: JSON.stringify(analysis.metadata)
                    }
                });

                results.push({ id: file.id, status: 'organized', newName: analysis.newName });

            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                console.error(`[InboxProcessor] Error procesando archivo ${file.id}:`, err);
                results.push({ id: file.id, status: 'error', error: errorMessage });
            }
        }

        console.log(`[InboxProcessor] Terminado. ${results.length} archivos procesados.`);
        return results;
    }

    /**
     * (MOCK) Analyze function for architecture placeholder
     */
    private async mockAnalyzeFile(fileName: string, type: string, sku: string): Promise<FileAnalysis> {
        // En código real, lanzaríamos al AiRouter.dispatch('GEMINI_PRO', TaskType.VISION_ANALYSIS, buff, ...)

        return {
            confidence: 0.85,
            recommendedPath: '04_PRODUCCION/TOF/UGC',
            newName: `${sku}_TOF_UGC_AV01_ANG02_HOOK1_v1.mp4`,
            metadata: {
                hook: 'Hook1 - Curiosidad',
                embudo: 'TOF',
                tipo: 'UGC',
                avatar: 'AV01 (Mamá ocupada)',
                angulo: 'ANG02 (Ahorro de tiempo)',
                duracion: '15',
                score: 85
            },
            needsManualReview: false
        };
    }
}
