import { prisma } from '@/lib/prisma';

/**
 * Helper para registrar uso de APIs en la base de datos
 */
export class UsageTracker {

    /**
     * Registrar uso de Vertex AI (Imagen 3)
     */
    static async logVertexImageGeneration(count: number = 1, storeId?: string) {
        const cost = count * 0.02; // $0.02 por imagen

        await prisma.aiUsageLog.create({
            data: {
                storeId: storeId || null,
                provider: 'VERTEX',
                model: 'vertex-imagen-3',
                taskType: 'image-generation',
                inputTokens: 0,
                estimatedCostEur: cost,
                status: 'SUCCESS'
            }
        });

        console.log(`[UsageTracker] Logged Vertex AI: ${count} images, $${cost.toFixed(3)}`);
    }

    /**
     * Registrar uso de ElevenLabs
     */
    static async logElevenLabsGeneration(textLength: number, storeId?: string) {
        const cost = (textLength / 1000) * 0.30; // $0.30 per 1000 chars

        await prisma.aiUsageLog.create({
            data: {
                storeId: storeId || null,
                provider: 'ELEVENLABS',
                model: 'elevenlabs-multilingual-v2',
                taskType: 'text-to-speech',
                inputTokens: textLength,
                estimatedCostEur: cost,
                status: 'SUCCESS'
            }
        });

        console.log(`[UsageTracker] Logged ElevenLabs: ${textLength} chars, $${cost.toFixed(3)}`);
    }

    /**
     * Registrar uso de Replicate (LivePortrait)
     */
    static async logReplicateAnimation(durationSeconds: number, storeId?: string) {
        const cost = durationSeconds * 0.01; // $0.01 per second

        await prisma.aiUsageLog.create({
            data: {
                storeId: storeId || null,
                provider: 'REPLICATE',
                model: 'replicate-liveportrait',
                taskType: 'video-animation',
                inputTokens: 0,
                estimatedCostEur: cost,
                status: 'SUCCESS'
            }
        });

        console.log(`[UsageTracker] Logged Replicate: ${durationSeconds}s, $${cost.toFixed(3)}`);
    }

    /**
     * Registrar batch de videos completo
     */
    static async logVideoBatch(
        videoCount: number,
        totalCost: number,
        storeId?: string,
        productId?: string
    ) {
        await prisma.aiUsageLog.create({
            data: {
                storeId: storeId || null,
                provider: 'CREATIVE-FACTORY',
                model: 'video-batch-generation',
                taskType: 'batch-processing',
                inputTokens: videoCount,
                estimatedCostEur: totalCost,
                status: 'SUCCESS'
            }
        });

        console.log(`[UsageTracker] Logged Batch: ${videoCount} videos, $${totalCost.toFixed(2)}`);
    }

    /**
     * Obtener costos del mes actual
     */
    static async getMonthlyTotal(storeId?: string): Promise<number> {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const logs = await prisma.aiUsageLog.findMany({
            where: {
                ...(storeId && { storeId }),
                createdAt: { gte: startOfMonth }
            }
        });

        return logs.reduce((sum, log) => sum + (log.estimatedCostEur || 0), 0);
    }
}
