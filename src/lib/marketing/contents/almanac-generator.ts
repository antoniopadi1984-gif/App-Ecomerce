import sharp from "sharp";
import { ImageGenerator } from "@/lib/creative/generators/image-generator";
import path from "path";
import fs from "fs/promises";

/**
 * 📅 ALMANAC GENERATOR
 * Generates high-impact ritual calendars with custom transformation goals.
 * Combines AI imagery with a professional layout.
 */
export class AlmanacGenerator {
    private static UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "contents");

    /**
     * Creates a Visual Almanac (30-day ritual)
     */
    static async generateAlmanac(productId: string, goal: string) {
        try {
            await fs.mkdir(this.UPLOADS_DIR, { recursive: true });
            const imageGen = new ImageGenerator();

            // 1. Generate Background with AI
            const bgUrl = await imageGen.generate({
                prompt: `High-end aesthetic background for a 30-day transformation ritual related to ${goal}, soft colors, minimalistic, premium textures`,
                style: 'photo', aspectRatio: '1:1'
            });

            // 2. Fetch image buffer (assuming it's a URL or needs download)
            const response = await fetch(bgUrl);
            const bgBuffer = Buffer.from(await response.arrayBuffer());

            // 3. Create SVG Overlay for Calendar Grid
            const svgOverlay = this.createCalendarSVG(goal);

            // 4. Composite with Sharp
            const outputFileName = `almanac_${productId}_${Date.now()}.png`;
            const outputPath = path.join(this.UPLOADS_DIR, outputFileName);

            await sharp(bgBuffer)
                .resize(1080, 1080)
                .composite([{
                    input: Buffer.from(svgOverlay),
                    top: 0,
                    left: 0
                }])
                .png()
                .toFile(outputPath);

            return `/uploads/contents/${outputFileName}`;

        } catch (error: any) {
            console.error("🛑 [AlmanacGenerator] Error:", error.message);
            throw error;
        }
    }

    private static createCalendarSVG(goal: string): string {
        const title = goal.toUpperCase();
        let rows = "";
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 7; j++) {
                const day = i * 7 + j + 1;
                if (day > 30) break;
                rows += `
                    <rect x="${100 + j * 120}" y="${300 + i * 120}" width="100" height="100" fill="white" fill-opacity="0.1" stroke="white" stroke-width="2" rx="10"/>
                    <text x="${110 + j * 120}" y="${330 + i * 120}" font-family="Arial" font-size="20" fill="white" font-weight="bold">${day}</text>
                `;
            }
        }

        return `
            <svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
                <rect width="1080" height="1080" fill="black" fill-opacity="0.4"/>
                <text x="540" y="150" font-family="Arial" font-size="48" fill="white" text-anchor="middle" font-weight="bold">RETORNO A LA EXCELENCIA</text>
                <text x="540" y="220" font-family="Arial" font-size="32" fill="#FB7185" text-anchor="middle" font-weight="bold">${title}</text>
                <line x1="100" y1="260" x2="980" y2="260" stroke="white" stroke-width="2" stroke-opacity="0.5"/>
                ${rows}
                <text x="540" y="1000" font-family="Arial" font-size="24" fill="white" text-anchor="middle" fill-opacity="0.7">ESTE ES TU MOMENTO. SIN EXCUSAS.</text>
            </svg>
        `;
    }
}
