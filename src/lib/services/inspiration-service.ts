import { prisma } from '../prisma';
import { agentDispatcher } from '../agents/agent-dispatcher';

export class InspirationService {
    /**
     * Importa un activo de inspiración (URL o Directo)
     */
    static async importAsset(data: {
        url?: string,
        storeId: string,
        productId?: string,
        type: 'VIDEO' | 'IMAGE',
        label?: string,
        driveUrl?: string,
        thumbnailUrl?: string
    }) {
        // 1. Crear el registro inicial
        const asset = await (prisma as any).inspirationAsset.create({
            data: {
                sourceUrl: data.url,
                storeId: data.storeId,
                productId: data.productId,
                type: data.type,
                label: data.label || 'Nueva Inspiración',
                driveUrl: data.driveUrl,
                thumbnailUrl: data.thumbnailUrl,
                sourcePlatform: data.url ? (
                    data.url.includes('tiktok') ? 'TIKTOK' :
                        data.url.includes('instagram') ? 'INSTAGRAM' :
                            data.url.includes('youtube') ? 'YOUTUBE' : 'WEB'
                ) : 'UPLOAD'
            }
        });

        // 2. Ejecutar análisis IA para etiquetado automático
        await this.analyzeAsset(asset.id);

        return asset;
    }

    /**
     * Análisis y etiquetado automático del activo
     */
    static async analyzeAsset(assetId: string) {
        const asset = await (prisma as any).inspirationAsset.findUnique({ where: { id: assetId } });
        if (!asset) return null;

        const prompt = `Analiza este activo creativo de inspiración y extrae sus etiquetas semánticas.
        TIPO: ${asset.type}
        URL: ${asset.sourceUrl || 'Subida directa'}
        
        TAREA:
        1. Categorizar el sector (ej. Fitness, Belleza, Tech, Hogar).
        2. Identificar el tipo de Hook (ej. Visual, Pregunta, Dolor Negativo, Educativo).
        3. Identificar la emoción dominante (ej. Sorpresa, Felicidad, Escepticismo, Urgencia).
        4. Descripción semántica breve de qué sucede.

        IMPORTANTE: Responde en JSON con campos: { sector: "", hookType: "", emotion: "", semanticDesc: "" }`;

        try {
            const response = await agentDispatcher.dispatch({
                role: 'research-lab',
                prompt,
                jsonSchema: true,
                model: process.env.GEMINI_MODEL_PRODUCTION || 'gemini-2.5-pro'
            });

            const analysis = JSON.parse(response.text.replace(/```json|```/g, '').trim());

            await (prisma as any).inspirationAsset.update({
                where: { id: assetId },
                data: {
                    analysisJson: JSON.stringify(analysis),
                    sector: analysis.sector,
                    hookType: analysis.hookType,
                    emotion: analysis.emotion,
                    semanticDesc: analysis.semanticDesc
                }
            });

            return analysis;
        } catch (e) {
            console.error("[InspirationService] Analysis error:", e);
            return null;
        }
    }
}
