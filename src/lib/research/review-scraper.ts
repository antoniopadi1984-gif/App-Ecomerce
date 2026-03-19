/**
 * REVIEW SCRAPER — extrae reseñas reales de múltiples fuentes
 * Amazon, Trustpilot, Google Reviews, Reddit
 */

export interface Review {
    source: string;
    rating?: number;
    title?: string;
    body: string;
    date?: string;
    verified?: boolean;
    helpful?: number;
    url?: string;
}

export interface ScrapedReviews {
    source: string;
    productName: string;
    totalFound: number;
    reviews: Review[];
    positiveThemes: string[];
    negativeThemes: string[];
    rawText: string;
}

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
};

export class ReviewScraper {

    /**
     * Scrape Amazon reviews from URL
     */
    static async scrapeAmazon(url: string): Promise<ScrapedReviews> {
        try {
            const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(15000) });
            const html = await res.text();

            // Extraer reseñas usando regex (sin cheerio para evitar deps)
            const reviewPattern = /<span data-hook="review-body"[^>]*>([\s\S]*?)<\/span>/g;
            const titlePattern = /<a data-hook="review-title"[^>]*>([\s\S]*?)<\/a>/g;
            const ratingPattern = /reviewed-star-rating[^>]*>([0-9.]+) out of 5/g;

            const reviews: Review[] = [];
            let match;

            const bodies: string[] = [];
            while ((match = reviewPattern.exec(html)) !== null) {
                bodies.push(match[1].replace(/<[^>]+>/g, '').trim().slice(0, 500));
            }

            for (const body of bodies.slice(0, 20)) {
                if (body.length > 20) {
                    reviews.push({ source: 'amazon', body, verified: true });
                }
            }

            return {
                source: 'amazon',
                productName: url,
                totalFound: reviews.length,
                reviews,
                positiveThemes: [],
                negativeThemes: [],
                rawText: bodies.join('\n'),
            };
        } catch (e: any) {
            return { source: 'amazon', productName: url, totalFound: 0, reviews: [], positiveThemes: [], negativeThemes: [], rawText: '' };
        }
    }

    /**
     * Scrape Google search results for reviews/forums
     */
    static async searchReviews(query: string, language: string = 'es'): Promise<ScrapedReviews> {
        const searchQueries = [
            `${query} opiniones reseñas site:reddit.com OR site:forocoches.com OR site:amazon.es`,
            `${query} reviews forum site:reddit.com`,
            `${query} testimonios resultados antes después`,
        ];

        const allText: string[] = [];
        const reviews: Review[] = [];

        for (const q of searchQueries.slice(0, 2)) {
            try {
                const url = `https://www.google.com/search?q=${encodeURIComponent(q)}&hl=${language}&num=10`;
                const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(10000) });
                const html = await res.text();

                // Extraer snippets de resultados
                const snippetPattern = /<div class="[^"]*VwiC3b[^"]*"[^>]*>([\s\S]*?)<\/div>/g;
                let match;
                while ((match = snippetPattern.exec(html)) !== null) {
                    const text = match[1].replace(/<[^>]+>/g, '').trim();
                    if (text.length > 50) {
                        allText.push(text);
                        reviews.push({ source: 'google_search', body: text.slice(0, 300) });
                    }
                }
            } catch {}
        }

        return {
            source: 'google_search',
            productName: query,
            totalFound: reviews.length,
            reviews: reviews.slice(0, 30),
            positiveThemes: [],
            negativeThemes: [],
            rawText: allText.join('\n').slice(0, 10000),
        };
    }

    /**
     * Fetch Reddit discussions
     */
    static async searchReddit(query: string): Promise<ScrapedReviews> {
        try {
            const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=relevance&limit=25&type=link`;
            const res = await fetch(url, {
                headers: { ...HEADERS, 'Accept': 'application/json' },
                signal: AbortSignal.timeout(10000)
            });
            const data = await res.json();
            const posts = data?.data?.children || [];

            const reviews: Review[] = posts
                .filter((p: any) => p.data?.selftext?.length > 50)
                .slice(0, 15)
                .map((p: any) => ({
                    source: 'reddit',
                    title: p.data.title,
                    body: (p.data.selftext || '').slice(0, 400),
                    url: `https://reddit.com${p.data.permalink}`,
                    helpful: p.data.score,
                }));

            const rawText = posts
                .map((p: any) => `${p.data.title}\n${p.data.selftext || ''}`)
                .join('\n').slice(0, 8000);

            return {
                source: 'reddit',
                productName: query,
                totalFound: reviews.length,
                reviews,
                positiveThemes: [],
                negativeThemes: [],
                rawText,
            };
        } catch {
            return { source: 'reddit', productName: query, totalFound: 0, reviews: [], positiveThemes: [], negativeThemes: [], rawText: '' };
        }
    }

    /**
     * Combinar todas las fuentes para el research
     */
    static async gatherAllReviews(productName: string, amazonUrls: string[] = [], language: string = 'es'): Promise<{
        totalReviews: number;
        sources: string[];
        combinedText: string;
        reviews: Review[];
    }> {
        const results = await Promise.allSettled([
            this.searchReviews(productName, language),
            this.searchReddit(productName),
            ...amazonUrls.slice(0, 2).map(url => this.scrapeAmazon(url)),
        ]);

        const allReviews: Review[] = [];
        const allText: string[] = [];
        const sources: string[] = [];

        for (const result of results) {
            if (result.status === 'fulfilled' && result.value.totalFound > 0) {
                allReviews.push(...result.value.reviews);
                allText.push(result.value.rawText);
                sources.push(result.value.source);
            }
        }

        return {
            totalReviews: allReviews.length,
            sources,
            combinedText: allText.join('\n\n').slice(0, 20000),
            reviews: allReviews.slice(0, 50),
        };
    }
}
