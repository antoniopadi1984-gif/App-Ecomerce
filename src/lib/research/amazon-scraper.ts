import * as cheerio from 'cheerio';

export interface AmazonReview {
    rating: number;
    title: string;
    body: string;
    verified: boolean;
    date: string;
}

export interface AmazonQA {
    question: string;
    answer: string;
}

export interface AmazonProductData {
    title: string;
    description: string;
    price: string;
    rating: number;
    reviewCount: number;
    reviews: {
        all: AmazonReview[];
        benefits: AmazonReview[];
        pains: AmazonReview[];
    };
    qa: AmazonQA[];
}

export class AmazonScraper {
    private static HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Device-Memory': '8',
        'Viewport-Width': '1920'
    };

    static async scrapeProduct(url: string): Promise<AmazonProductData | null> {
        try {
            // Normalize URL to handle potential referral tags
            const cleanUrl = url.split('?')[0];

            const response = await fetch(cleanUrl, { headers: this.HEADERS });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const html = await response.text();
            const $ = cheerio.load(html);

            const title = $('#productTitle').text().trim() || 'Desconocido';
            const priceWhole = $('.a-price-whole').first().text().trim();
            const priceFraction = $('.a-price-fraction').first().text().trim();
            const price = priceWhole ? `${priceWhole}${priceFraction}€` : 'N/A';

            const ratingText = $('.a-icon-alt').first().text().trim();
            const rating = parseFloat(ratingText.split(' ')[0]) || 0;
            const reviewCountStr = $('#acrCustomerReviewText').first().text().trim();
            const reviewCount = parseInt(reviewCountStr.replace(/[^0-9]/g, '')) || 0;

            // 1. EXTRACT REVIEWS (Segmented)
            const allReviews: AmazonReview[] = [];
            $('.review').each((i, el) => {
                const r = $(el);
                const reviewRating = parseFloat(r.find('.a-icon-alt').text().split(' ')[0]) || 0;

                allReviews.push({
                    rating: reviewRating,
                    title: r.find('.review-title-content').text().trim(),
                    body: r.find('.review-text-content').text().trim(),
                    verified: r.find('.a-size-mini').text().toLowerCase().includes('compra verificada') ||
                        r.find('.a-declarative').text().toLowerCase().includes('compra verificada'),
                    date: r.find('.review-date').text().trim()
                });
            });

            const benefits = allReviews.filter(r => r.rating >= 4);
            const pains = allReviews.filter(r => r.rating <= 2);

            // 2. EXTRACT Q&A (Mining Objections)
            const qa: AmazonQA[] = [];
            $('.a-spacing-base .a-fixed-left-grid').each((i, el) => {
                const qBlock = $(el);
                const question = qBlock.find('.a-link-normal').text().trim();
                const answer = qBlock.find('.a-fixed-left-grid-col.a-col-right').first().text().trim();

                if (question && answer) {
                    qa.push({ question, answer });
                }
            });

            // 3. Fallback for Q&A if the above selector fails
            if (qa.length === 0) {
                $('.askTeaserQuestions .a-declarative').each((i, el) => {
                    const question = $(el).text().trim();
                    if (question) qa.push({ question, answer: "N/A" });
                });
            }

            return {
                title,
                description: $('#feature-bullets').text().trim() || $('#productDescription').text().trim(),
                price,
                rating,
                reviewCount,
                reviews: {
                    all: allReviews,
                    benefits,
                    pains
                },
                qa: qa.slice(0, 5) // Top 5 Q&A
            };
        } catch (error) {
            console.error('[AmazonScraper] Deep Scrape Error:', error);
            return null;
        }
    }

    /**
     * Specialized method to get MORE reviews if needed
     */
    static async getMoreReviews(url: string, pages: number = 2): Promise<AmazonReview[]> {
        // Implementation for multipage scraping in the future
        return [];
    }
}
