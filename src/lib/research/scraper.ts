import * as cheerio from 'cheerio';

export class Scraper {
    static async scrapeUrl(url: string): Promise<{ title: string; content: string; text: string }> {
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const html = await response.text();
            const $ = cheerio.load(html);

            // Remove unwanted elements
            $('script, style, noscript, nav, footer, header, iframe').remove();

            const title = $('title').text().trim() || 'No Title';

            // Extract main content heuristic
            const mainContent = $('main, article, .content, #content').first();
            const bodyText = mainContent.length ? mainContent.text() : $('body').text();

            const cleanText = bodyText
                .replace(/\s+/g, ' ')
                .replace(/\n\s*\n/g, '\n')
                .trim();

            return {
                title,
                content: html.substring(0, 50000), // Raw HTML snippet
                text: cleanText.substring(0, 30000) // Cleaned text
            };
        } catch (error: any) {
            console.error(`Error scraping ${url}:`, error.message);
            return { title: 'Error', content: '', text: `Error: ${error.message}` };
        }
    }
}
