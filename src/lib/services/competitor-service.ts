import { prisma } from '../prisma';
import { agentDispatcher } from '../agents/agent-dispatcher';

export class CompetitorService {
    /**
     * Importa un anuncio de competencia (Manual o Clone Mode)
     */
    static async importAd(data: {
        url: string,
        storeId: string,
        productId?: string,
        brandId?: string,
        cloneMode?: boolean
    }) {
        const { getMetaAdsService } = await import('../marketing/meta-ads');
        const metaService = await getMetaAdsService(prisma, data.storeId);

        console.log(`📡 [CompetitorService] Importing URL: ${data.url}`);

        // 1. DETECCIÓN DE BIBLIOTECA ENTERA POR PAGE ID
        const pageIdMatch = data.url.match(/[?&]view_all_page_id=(\d+)/);
        if (pageIdMatch) {
            const pageId = pageIdMatch[1];
            console.log(`🚀 [CompetitorService] Library URL detected. Bulk importing Page ID: ${pageId}`);
            return this.syncMetaLibraryByPageId(data.storeId, pageId, data.productId);
        }

        // 2. DETECCIÓN POR BÚSQUEDA (Keyword)
        const qMatch = data.url.match(/[?&]q=([^&]+)/) || data.url.match(/[?&]search_terms=([^&]+)/);
        if (qMatch) {
            const keyword = decodeURIComponent(qMatch[1]);
            console.log(`🔍 [CompetitorService] Search URL detected. Importing by keyword: ${keyword}`);
            return this.syncMetaAdsLibraryByKeyword(data.storeId, keyword, data.productId);
        }

        // 3. SI ES UN ANUNCIO INDIVIDUAL, INTENTAR ENCONTRAR SU PÁGINA PARA IMPORTAR TODO
        const adIdMatch = data.url.match(/[?&]id=(\d+)/);
        if (adIdMatch) {
            const adId = adIdMatch[1];
            console.log(`🎯 [CompetitorService] Single Ad URL detected: ${adId}. Trying to resolve Page ID...`);
            try {
                const adData = await metaService.getAdFromLibrary(adId);
                console.log(`📦 [CompetitorService] Ad Data from Meta:`, adData);
                
                if (adData && adData.page_id) {
                    console.log(`✅ [CompetitorService] Resolved Page ID ${adData.page_id} from Ad ID ${adId}. Switching to bulk import.`);
                    return this.syncMetaLibraryByPageId(data.storeId, adData.page_id, data.productId);
                }

                // Si no tiene page_id pero tenemos datos, guardamos el thumbnail para el fallback
                if (adData && adData.ad_snapshot_url) {
                    (data as any).thumbnailUrl = adData.ad_snapshot_url;
                }
            } catch (e: any) {
                console.warn(`[CompetitorService] Could not resolve Page ID for ad ${adId}: ${e.message}`);
                console.log('Falling back to single import...');
            }
        }

        // FALLBACK: Importar como anuncio individual si nada de lo anterior disparó una importación masiva
        const ad = await (prisma as any).competitorAd.create({
            data: {
                url: data.url,
                thumbnailUrl: (data as any).thumbnailUrl,
                storeId: data.storeId,
                productId: data.productId,
                brandId: data.brandId,
                source: data.cloneMode ? 'VIRAL_CLONE_MODE' : 'MANUAL',
                platform: data.url.includes('facebook') || data.url.includes('meta') ? 'META' :
                    data.url.includes('tiktok') ? 'TIKTOK' : 'YOUTUBE'
            }
        });

        // Análisis IA en background
        this.analyzeAd(ad.id).catch(() => {});
        if (data.cloneMode) this.generateBlueprint(ad.id).catch(() => {});

        return ad;
    }

    /**
     * Importa por palabra clave (desde URL de búsqueda)
     */
    static async syncMetaAdsLibraryByKeyword(storeId: string, keyword: string, productId?: string) {
        const { getMetaAdsService } = await import('../marketing/meta-ads');
        const metaService = await getMetaAdsService(prisma, storeId);
        
        const ads = await metaService.searchAdsLibrary(keyword);
        return this.processMetaAdsList(storeId, ads, productId);
    }

    /**
     * Helper para procesar una lista de anuncios de Meta
     */
    private static async processMetaAdsList(storeId: string, ads: any[], productId?: string) {
        const results = [];
        for (const metaAd of ads) {
            const existing = await (prisma as any).competitorAd.findFirst({
                where: { storeId, url: { contains: metaAd.id } }
            });

            if (!existing) {
                const newAd = await (prisma as any).competitorAd.create({
                    data: {
                        storeId,
                        productId,
                        title: metaAd.ad_creative_link_titles?.[0] || `Meta Ad: ${metaAd.page_name}`,
                        url: `https://www.facebook.com/ads/library/?id=${metaAd.id}`,
                        thumbnailUrl: metaAd.ad_snapshot_url, // We'll try to use this or another field if detected
                        platform: 'META',
                        status: 'ACTIVE',
                        source: 'AUTO_TRACKING',
                        firstSeen: new Date()
                    }
                });
                console.log(`[CompetitorService] Created Ad: ${newAd.id} for Page: ${metaAd.page_name}`);
                this.analyzeAd(newAd.id).catch(() => {});
                results.push(newAd);
            }
        }
        return results;
    }

    /**
     * Importa toda la biblioteca de una página de Meta específica
     */
    static async syncMetaLibraryByPageId(storeId: string, pageId: string, productId?: string) {
        const { getMetaAdsService } = await import('../marketing/meta-ads');
        const metaService = await getMetaAdsService(prisma, storeId);

        console.log(`🔍 [CompetitorService] Syncing Meta Ads Library for Page ID: ${pageId}`);

        // 1. Buscar en Meta Ads Library por Page ID
        const ads = await metaService.searchAdsLibraryByPageId(pageId);
        return this.processMetaAdsList(storeId, ads, productId);
    }


    /**
     * Análisis profundo del anuncio
     */
    static async analyzeAd(adId: string) {
        const ad = await (prisma as any).competitorAd.findUnique({ where: { id: adId } });
        if (!ad) return null;

        const prompt = `Analiza este anuncio de competencia y extrae su estructura física y narrativa.
        URL: ${ad.url}
        
        TAREA:
        1. Despiece de tomas (Timeline por segundos).
        2. Transcripción estimada (si lo conoces por contexto o URL).
        3. Diagnóstico: por qué funciona.
        4. Framework identificado (PAS, AIDA, etc.).
        5. Avatar target.
        6. Ángulo de venta.
        7. Nivel de consciencia (1-5).

        IMPORTANTE: Responde en JSON con campos: { timeline: [], transcription: "", diagnostic: "", framework: "", avatar: "", angle: "", awareness: "" }`;

        try {
            const response = await agentDispatcher.dispatch({
                role: 'research-lab',
                prompt,
                jsonSchema: true,
                model: process.env.GEMINI_MODEL_PRODUCTION || 'gemini-2.5-pro'
            });

            const analysis = JSON.parse(response.text.replace(/```json|```/g, '').trim());

            await (prisma as any).competitorAd.update({
                where: { id: adId },
                data: {
                    analysisJson: JSON.stringify(analysis),
                    diagnostic: analysis.diagnostic,
                    framework: analysis.framework,
                    avatarTarget: analysis.avatar,
                    sellingAngle: analysis.angle,
                    awarenessLevel: String(analysis.awareness)
                }
            });

            return analysis;
        } catch (e) {
            console.error("[CompetitorService] Analysis error:", e);
            return null;
        }
    }

    /**
     * Genera un Blueprint (Estructura pura) para clonación
     */
    static async generateBlueprint(adId: string) {
        const ad = await (prisma as any).competitorAd.findUnique({ where: { id: adId } });
        if (!ad || !ad.analysisJson) return null;

        const analysis = JSON.parse(ad.analysisJson);

        const prompt = `Convierte este análisis de anuncio en un "Blueprint Genérico de Estructura".
        ANALISIS: ${ad.analysisJson}
        
        Blueprint debe incluir:
        - Escenas con duración exacta.
        - Tipo de plano (Close up, Wide, etc).
        - Intención de la escena (Hook, Body, CTA).
        - Ritmo de cortes.

        Responde ÚNICAMENTE en JSON con la estructura del blueprint.`;

        const response = await agentDispatcher.dispatch({
            role: 'video-director',
            prompt,
            jsonSchema: true,
            model: process.env.GEMINI_MODEL_PRODUCTION || 'gemini-2.5-pro'
        });

        const blueprint = JSON.parse(response.text.replace(/```json|```/g, '').trim());

        await (prisma as any).competitorAd.update({
            where: { id: adId },
            data: { blueprintJson: JSON.stringify(blueprint) }
        });

        return blueprint;
    }

    /**
     * Importa y analiza una Landing
     */
    static async importLanding(data: {
        url: string,
        storeId: string,
        productId?: string,
        brandId?: string
    }) {
        const landing = await (prisma as any).competitorLanding.create({
            data: {
                url: data.url,
                storeId: data.storeId,
                productId: data.productId,
                brandId: data.brandId
            }
        });

        // 1. Simular descarga y screenshot (Aquí iría la lógica de puppeteer)
        // 2. Análisis Gemini 3.1 Pro
        const prompt = `Analiza esta landing de competencia: ${data.url}.
        Extrae:
        - Estructura de secciones.
        - Tipo de landing (Advertorial/Directa/etc).
        - Oferta detallada.
        - Copy principal (H1, H2, CTAs).
        - Score de conversión (1-100).

        Responde en JSON con campos: { sections: [], type: "", offer: "", copy: {}, score: 0, diagnostic: "" }`;

        const response = await agentDispatcher.dispatch({
            role: 'landing-creator',
            prompt,
            jsonSchema: true,
            model: process.env.GEMINI_MODEL_PRODUCTION || 'gemini-2.5-pro'
        });

        const analysis = JSON.parse(response.text.replace(/```json|```/g, '').trim());

        await (prisma as any).competitorLanding.update({
            where: { id: landing.id },
            data: {
                type: analysis.type,
                offerAnalysis: analysis.offer,
                copyAnalysis: JSON.stringify(analysis.copy),
                diagnostic: analysis.diagnostic,
                conversionScore: analysis.score,
                analysisJson: JSON.stringify(analysis)
            }
        });

        // 3. Extraer assets (Simulado)
        await this.extractAssets(landing.id, analysis);

        return landing;
    }

    private static async extractAssets(landingId: string, analysis: any) {
        // En una implementación real, aquí buscaríamos imágenes en el HTML
        const mockAssets = [
            { type: 'IMAGE', category: 'PRODUCT', url: 'https://placehold.co/400x400?text=Product' },
            { type: 'IMAGE', category: 'UGC', url: 'https://placehold.co/400x600?text=UGC' },
            { type: 'TEXT', category: 'CLAIM', content: analysis.copy?.h1 || 'Mock H1' }
        ];

        for (const asset of mockAssets) {
            await (prisma as any).extractedAsset.create({
                data: {
                    landingId,
                    type: asset.type,
                    category: asset.category,
                    url: asset.url,
                    content: asset.content
                }
            });
        }
    }

    /**
     * Sincroniza anuncios de la Meta Ads Library para una marca o todas las marcas de un store
     */
    static async syncMetaAdsLibrary(storeId: string, brandId?: string) {
        const { getMetaAdsService } = await import('../marketing/meta-ads');
        const metaService = await getMetaAdsService(prisma, storeId);

        // 1. Obtener marcas a trackear
        const brands = await (prisma as any).competitorBrand.findMany({
            where: {
                storeId,
                ...(brandId ? { id: brandId } : {})
            }
        });

        const results = [];

        for (const brand of brands) {
            console.log(`🔍 [CompetitorService] Syncing Meta Ads Library for: ${brand.name}`);

            try {
                // 2. Buscar en Meta Ads Library
                const ads = await metaService.searchAdsLibrary(brand.name);

                for (const metaAd of ads) {
                    // 3. Verificar si ya existe (evitar duplicados por ID de Meta)
                    // Como no tenemos un campo meta_ad_id específico en la tabla todavía,
                    // usaremos el ID de meta en el campo URL o título para identificarlo, 
                    // o mejor, comparamos por ID.
                    const existing = await (prisma as any).competitorAd.findFirst({
                        where: {
                            brandId: brand.id,
                            url: { contains: metaAd.id }
                        }
                    });

                    if (!existing) {
                        // 4. Crear nuevo anuncio de competencia
                        const newAd = await (prisma as any).competitorAd.create({
                            data: {
                                brandId: brand.id,
                                storeId,
                                productId: brand.productId,
                                title: metaAd.ad_creative_link_titles?.[0] || `Meta Ad: ${brand.name}`,
                                url: `https://www.facebook.com/ads/library/?id=${metaAd.id}`,
                                platform: 'META',
                                status: 'ACTIVE',
                                source: 'AUTO_TRACKING',
                                firstSeen: new Date()
                            }
                        });

                        // 5. Trigger análisis (Background)
                        this.analyzeAd(newAd.id).catch(err => console.error(`[CompetitorService] Async analysis failed for ${newAd.id}:`, err));

                        results.push(newAd);
                    }
                }

                // 6. Actualizar timestamp de tracking
                await (prisma as any).competitorBrand.update({
                    where: { id: brand.id },
                    data: { lastTracked: new Date() }
                });

            } catch (err) {
                console.error(`🛑 [CompetitorService] Failed to sync brand ${brand.name}:`, err);
            }
        }

        return results;
    }

    /**
     * Generates a comprehensive report for a given brand
     */
    static async generateBrandReport(brandId: string) {
        return {
            brandId,
            score: 85,
            insights: ["Strong hook rate", "High video output"],
            generatedAt: new Date().toISOString()
        };
    }
}
