import { agentDispatcher } from '../agents/agent-dispatcher';
import { prisma } from '../prisma';

export class SemanticIndexService {
    /**
     * Indexa un CreativeAsset (Video o Imagen)
     */
    static async indexCreativeAsset(id: string) {
        const asset = await (prisma as any).creativeAsset.findUnique({
            where: { id },
            include: { product: true }
        });
        if (!asset) return;

        const analysis = await this.generateSemanticAnalysis({
            type: asset.type,
            name: asset.name,
            content: `Transcripción: ${asset.transcription || ''}. Hook: ${asset.hookText || ''}. Ángulo: ${asset.angulo || ''}`,
            productName: asset.product?.title || '',
            context: asset.funnelStage || ''
        });

        if (analysis) {
            await (prisma as any).creativeAsset.update({
                where: { id },
                data: {
                    semanticDescription: analysis.description,
                    tagsJson: JSON.stringify(analysis.tags),
                    format: analysis.tags.formato,
                    framework: analysis.tags.framework,
                    dominantEmotion: analysis.tags.emocion_dominante,
                    funnelStage: analysis.tags.fase_embudo || asset.funnelStage
                }
            });
        }
        return analysis;
    }

    /**
     * Indexa un AvatarAsset (Para el pack de avatar)
     */
    static async indexAvatarAsset(id: string) {
        const asset = await (prisma as any).avatarAsset.findUnique({
            where: { id },
            include: { product: true }
        });
        if (!asset) return;

        const description = await this.generateSimpleDescription({
            type: asset.type,
            name: asset.name || 'Avatar Asset',
            content: `Contexto: ${asset.type}. URL: ${asset.url}`,
            productName: asset.product?.title || '',
            context: 'Avatar Library'
        });

        if (description) {
            await (prisma as any).avatarAsset.update({
                where: { id },
                data: { semanticDescription: description }
            });
        }
        return description;
    }

    /**
     * Indexa una Landing Project
     */
    static async indexLanding(id: string) {
        const landing = await (prisma as any).landingProject.findUnique({
            where: { id },
            include: { product: true }
        });
        if (!landing) return;

        const description = await this.generateSimpleDescription({
            type: 'LANDING',
            name: landing.name,
            content: landing.blocksJson ? `Estructura JSON: ${landing.blocksJson.substring(0, 1000)}` : '',
            productName: landing.product?.title || '',
            context: 'Landing Page'
        });

        if (description) {
            await (prisma as any).landingProject.update({
                where: { id },
                data: { semanticDescription: description }
            });
        }
        return description;
    }

    /**
     * Indexa un Script de la biblioteca o proyecto
     */
    static async indexScript(id: string) {
        const script = await (prisma as any).scriptLibrary.findUnique({
            where: { id },
            include: { product: true }
        });
        if (!script) return;

        const description = await this.generateSimpleDescription({
            type: 'SCRIPT',
            name: `Script ${script.framework}`,
            content: `Hook: ${script.hook}. Body: ${script.body}. CTA: ${script.cta}`,
            productName: script.product?.title || '',
            context: script.funnelStage || ''
        });

        if (description) {
            await (prisma as any).scriptLibrary.update({
                where: { id },
                data: { semanticDescription: description }
            });
        }
        return description;
    }

    private static async generateSemanticAnalysis(data: {
        type: string,
        name: string,
        content: string,
        productName: string,
        context: string
    }) {
        const prompt = `Analiza este asset y genera una descripción semántica y etiquetas (tags) automáticas para un sistema de búsqueda y gestión de activos.
        
        ASSET:
        - Tipo: ${data.type}
        - Nombre: ${data.name}
        - Producto: ${data.productName}
        - Contexto: ${data.context}
        - Contenido analizable: ${data.content}

        TAREA:
        1. Escribe una descripción semántica rica en keywords (qué se ve, qué se escucha, hook, emoción, contexto).
        2. Determina los siguientes metadatos:
           · tipo_hook: curiosidad / miedo / autoridad / beneficio / escepticismo / etc.
           · angulo: mecanismo / problema / comparativa / demostración / etc.
           · formato: UGC / talking_head / demo / broll_solo / mix / etc.
           · fase_embudo: frio / templado / caliente / retargeting
           · framework: PAS / AIDA / story_sell / direct_response / etc.
           · emocion_dominante: urgencia / confianza / empatía / alegría / etc.

        IMPORTANTE: Responde ÚNICAMENTE en formato JSON con la siguiente estructura:
        {
          "description": "párrafo rico en keywords...",
          "tags": {
            "tipo_hook": "...",
            "angulo": "...",
            "formato": "...",
            "fase_embudo": "...",
            "framework": "...",
            "emocion_dominante": "..."
          }
        }`;

        try {
            const response = await agentDispatcher.dispatch({
                role: 'research-lab',
                prompt,
                jsonSchema: true,
                model: 'gemini-3.1-flash-lite-preview'
            });

            const cleanText = response.text.replace(/```json|```/g, '').trim();
            return JSON.parse(cleanText);
        } catch (e: any) {
            console.error("[SemanticIndexService] AI analysis error:", e);
            return null;
        }
    }

    /**
     * Legacy/Simple support for other assets
     */
    private static async generateSimpleDescription(data: any) {
        const analysis = await this.generateSemanticAnalysis(data);
        return analysis?.description || null;
    }
}
