import { prisma } from '../prisma';
import * as cheerio from 'cheerio';
import { API_CONFIG } from '../config/api-config';

export interface UnifiedSearchResult {
    url: string;
    title: string;
    snippet?: string;
    content?: string;
    score?: number;
    publishedAt?: string;
    provider: string;
}

/**
 * Vertex AI Search Client
 */
class VertexAISearch {
    private apiKey: string;
    private projectId: string;
    private location: string;
    private dataStoreId: string;

    constructor() {
        this.apiKey = API_CONFIG.vertexAI.apiKey;
        this.projectId = API_CONFIG.vertexAI.projectId;
        this.location = API_CONFIG.vertexAI.location;
        this.dataStoreId = API_CONFIG.vertexAI.search.dataStoreId;
    }

    async search(query: string, options: { pageSize?: number } = {}): Promise<UnifiedSearchResult[]> {
        // Si no está configurado, retornar vacío
        if (!this.apiKey || !this.projectId || !this.dataStoreId) {
            console.warn('[VertexAISearch] Not configured, skipping Vertex AI search');
            return [];
        }

        try {
            const url = `https://discoveryengine.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/collections/default_collection/dataStores/${this.dataStoreId}/servingConfigs/default_search:search`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': this.apiKey
                },
                body: JSON.stringify({
                    query,
                    pageSize: options.pageSize || 20,
                    queryExpansionSpec: { condition: 'AUTO' },
                    spellCorrectionSpec: { mode: 'AUTO' },
                    contentSearchSpec: {
                        snippetSpec: {
                            returnSnippet: true,
                            maxSnippetCount: 3
                        }
                    }
                })
            });

            if (!response.ok) {
                const error = await response.text();
                console.error('[VertexAISearch] API Error:', error);
                return [];
            }

            const data = await response.json();
            const results: UnifiedSearchResult[] = [];

            for (const result of data.results || []) {
                const doc = result.document?.derivedStructData;
                if (!doc) continue;

                results.push({
                    url: doc.link || '',
                    title: doc.title || '',
                    snippet: doc.snippets?.[0]?.snippet || doc.snippet || '',
                    content: doc.htmlSnippet || '',
                    provider: 'VERTEX_AI'
                });
            }

            return results;

        } catch (error: any) {
            console.error('[VertexAISearch] Error:', error.message);
            return [];
        }
    }

    async searchForums(query: string): Promise<UnifiedSearchResult[]> {
        return this.search(
            `${query} site:reddit.com OR site:quora.com OR site:forocoches.com OR site:trustpilot.com`,
            { pageSize: 25 }
        );
    }

    isConfigured(): boolean {
        return !!(this.apiKey && this.projectId && this.dataStoreId);
    }
}

export class SearchOrchestrator {
    private static vertexSearch = new VertexAISearch();

    /**
     * Búsqueda multi-fuente con fallback automático
     * Prioridad: Vertex AI → Google Scraping
     */
    static async search(
        productId: string,
        query: string,
        type: 'GENERAL' | 'FORUMS' = 'GENERAL',
        deepMode: boolean = false
    ): Promise<UnifiedSearchResult[]> {

        console.log(`[SearchOrchestrator] Buscando: "${query}" (Tipo: ${type}, Deep: ${deepMode})`);

        let allResults: UnifiedSearchResult[] = [];

        // Generar queries
        const queries = deepMode && type === 'FORUMS'
            ? this.generateForumQueries(query)
            : [query];

        for (const q of queries) {
            try {
                // STRATEGY 1: Intentar con Vertex AI primero (si está configurado)
                if (this.vertexSearch.isConfigured()) {
                    console.log(`[SearchOrchestrator] Usando Vertex AI Search...`);

                    const vertexResults = type === 'FORUMS'
                        ? await this.vertexSearch.searchForums(q)
                        : await this.vertexSearch.search(q);

                    if (vertexResults.length > 0) {
                        console.log(`[SearchOrchestrator] Vertex AI: ${vertexResults.length} resultados`);

                        // Scrape contenido si es necesario
                        for (const result of vertexResults) {
                            if (!result.content || result.content.length < 200) {
                                const scrapedContent = await this.scrapeUrl(result.url);
                                if (scrapedContent) {
                                    result.content = scrapedContent;
                                }
                            }
                            allResults.push(result);
                        }

                        // Guardar en DB
                        await this.saveSearchResults(productId, q, vertexResults, 'VERTEX_AI');

                        // Si Vertex AI dio buenos resultados, continuar con siguiente query
                        await this.sleep(1000);
                        continue;
                    }
                }

                // STRATEGY 2: Fallback a Google Scraping
                console.log(`[SearchOrchestrator] Fallback a Google Scraping...`);
                const googleResults = await this.googleForumSearch(q, type);

                if (googleResults.length > 0) {
                    console.log(`[SearchOrchestrator] Google Scraping: ${googleResults.length} resultados`);

                    // Scrape contenido
                    for (const result of googleResults) {
                        try {
                            const scrapedContent = await this.scrapeUrl(result.url);
                            if (scrapedContent) {
                                result.content = scrapedContent;
                            }
                            allResults.push(result);
                        } catch (scrapeError) {
                            console.warn(`[SearchOrchestrator] Error scraping ${result.url}`);
                            allResults.push(result);
                        }
                    }

                    // Guardar en DB
                    await this.saveSearchResults(productId, q, googleResults, 'GOOGLE_SCRAPE');
                }

            } catch (error: any) {
                console.error(`[SearchOrchestrator] Error para "${q}":`, error.message);
            }

            // Delay entre queries
            await this.sleep(2000);
        }

        // Deduplicar por URL
        const unique = new Map();
        for (const item of allResults) {
            if (!unique.has(item.url)) unique.set(item.url, item);
        }

        console.log(`[SearchOrchestrator] Total resultados únicos: ${unique.size}`);
        return Array.from(unique.values());
    }

    /**
     * Guardar resultados en DB
     */
    private static async saveSearchResults(
        productId: string,
        query: string,
        results: UnifiedSearchResult[],
        provider: string
    ): Promise<void> {
        try {
            const searchQuery = await (prisma as any).searchQuery.create({
                data: {
                    productId,
                    query,
                    provider,
                    status: 'COMPLETED',
                    resultsCount: results.length
                }
            });

            for (const res of results) {
                await (prisma as any).searchResult.create({
                    data: {
                        queryId: searchQuery.id,
                        url: res.url,
                        title: res.title,
                        snippet: res.snippet,
                        content: res.content,
                        provider: res.provider
                    }
                }).catch(() => { }); // Silent fail si ya existe
            }
        } catch (error: any) {
            console.error('[SearchOrchestrator] Error guardando en DB:', error.message);
        }
    }

    /**
     * Buscar en Google con site: filters para foros específicos
     */
    private static async googleForumSearch(query: string, type: string): Promise<UnifiedSearchResult[]> {
        const forumSites = [
            'reddit.com',
            'forocoches.com',
            'quora.com',
            'burbuja.info',
            'elotrolado.net',
            'meneame.net',
            'trustpilot.es',
            'trustpilot.com',
            'amazon.es/product-reviews',
            'amazon.com/product-reviews'
        ];

        // Construir query con site: filters
        let finalQuery = query;
        if (type === 'FORUMS') {
            const siteFilter = forumSites.map(s => `site:${s}`).join(' OR ');
            finalQuery = `${query} (${siteFilter})`;
        }

        const results: UnifiedSearchResult[] = [];

        try {
            const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(finalQuery)}&num=20`;

            const response = await fetch(googleUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            const html = await response.text();
            const $ = cheerio.load(html);

            // Parsear resultados de Google
            $('.g').each((i, elem) => {
                const title = $(elem).find('h3').text();
                const url = $(elem).find('a').attr('href');
                const snippet = $(elem).find('.VwiC3b').text() || $(elem).find('.IsZvec').text();

                if (title && url && url.startsWith('http')) {
                    results.push({
                        url,
                        title,
                        snippet,
                        provider: 'GOOGLE_SCRAPE'
                    });
                }
            });

        } catch (error: any) {
            console.error('[SearchOrchestrator] Error en Google search:', error.message);
        }

        return results.slice(0, 15);
    }

    /**
     * Scrape contenido de una URL
     */
    private static async scrapeUrl(url: string): Promise<string | null> {
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                signal: AbortSignal.timeout(10000)
            });

            if (!response.ok) return null;

            const html = await response.text();
            const $ = cheerio.load(html);

            // Remover elementos no deseados
            $('script, style, nav, header, footer, iframe, ads').remove();

            let content = '';

            // Selectores específicos por sitio
            if (url.includes('reddit.com')) {
                content = $('.md').text() || $('div[data-test-id="post-content"]').text() || $('[slot="text-body"]').text();
            } else if (url.includes('forocoches.com')) {
                content = $('.cuerpo').text() || $('.postbit').text();
            } else if (url.includes('quora.com')) {
                content = $('.q-text').text() || $('.Answer').text() || $('[class*="answer"]').text();
            } else if (url.includes('trustpilot')) {
                content = $('.review-content__text').text() || $('[data-review-text-typography]').text();
            } else if (url.includes('amazon')) {
                content = $('.review-text').text() || $('[data-hook="review-body"]').text();
            } else {
                // Genérico
                content = $('article').text() || $('main').text() || $('.content').text() || $('body').text();
            }

            // Limpiar y limitar
            content = content
                .trim()
                .replace(/\s+/g, ' ')
                .substring(0, 5000);

            return content.length > 100 ? content : null;

        } catch (error: any) {
            console.error(`[SearchOrchestrator] Error scraping ${url}:`, error.message);
            return null;
        }
    }

    /**
     * Generar queries agresivas para foros
     */
    private static generateForumQueries(baseTopic: string): string[] {
        const risks = ["estafa", "no funciona", "timo", "efectos secundarios"];
        const reviews = ["opiniones reales", "experiencia real", "quejas"];

        const queries: string[] = [baseTopic];

        // Añadir variaciones
        risks.slice(0, 2).forEach(risk => queries.push(`${baseTopic} ${risk}`));
        reviews.slice(0, 2).forEach(rev => queries.push(`${baseTopic} ${rev}`));

        // Limitar a 7 queries max
        return queries.slice(0, 7);
    }

    /**
     * Búsqueda específica de evidencia para un claim
     */
    static async seekSpecificEvidence(productId: string, claim: string): Promise<UnifiedSearchResult[]> {
        const query = `evidence proving that ${claim}`;
        console.log(`[SearchOrchestrator] Buscando evidencia para: ${claim}`);
        return this.search(productId, query, 'FORUMS', false);
    }

    /**
     * Helper: Sleep
     */
    private static sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}