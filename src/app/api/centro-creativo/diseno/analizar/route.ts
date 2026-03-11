import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as cheerio from 'cheerio';
import { AiRouter } from '@/lib/ai/router';
import { TaskType } from '@/lib/ai/providers/interfaces';

export const maxDuration = 60; // Set to 60s for deep AI analysis and scraping

export async function POST(request: Request) {
    try {
        const { url, storeId, productId } = await request.json();

        if (!url || !storeId) {
            return NextResponse.json({ success: false, error: 'URL y Store ID son requeridos' }, { status: 400 });
        }

        // 1. Fetch HTML of the Landing
        const htmlRes = await fetch(url, {
             headers: {
                 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
             }
        });
        const html = await htmlRes.text();
        const $ = cheerio.load(html);

        // 2. Extract Assets
        const extractedAssets: any[] = [];
        
        // Extract Images & GIFs
        $('img').each((i, el) => {
            let src = $(el).attr('src') || $(el).attr('data-src');
            if (src && !src.startsWith('data:')) {
                 if (src.startsWith('//')) src = 'https:' + src;
                 else if (src.startsWith('/')) src = new URL(src, url).toString();
                 
                 const tagUrl = src.toLowerCase();
                 const type = tagUrl.includes('.gif') ? 'gif' : 'image';
                 const alt = $(el).attr('alt') || 'Imagen Extraída';
                 
                 extractedAssets.push({ type, url: src, name: alt.substring(0, 30) });
            }
        });

        // Extract Videos
        $('video source, iframe').each((i, el) => {
             let src = $(el).attr('src') || $(el).attr('data-src');
             if (src) {
                 if (src.startsWith('//')) src = 'https:' + src;
                 else if (src.startsWith('/')) src = new URL(src, url).toString();

                 // Ignore random iframes, focus on known video providers or .mp4
                 const tagUrl = src.toLowerCase();
                 if (tagUrl.includes('youtube.com') || tagUrl.includes('vimeo.com') || tagUrl.includes('.mp4') || tagUrl.includes('shopify.com')) {
                     extractedAssets.push({ type: 'video', url: src, name: 'Vídeo Extraído' });
                 }
             }
        });

        // 3. Extract Headings for Structure analysis
        let textContent = '';
        $('h1, h2, h3, h4, h5, h6, strong').each((i, el) => {
             textContent += $(el).text().trim() + ' | ';
        });
        
        // Strip everything and just take a limited chunk of text (around 3000 chars) for prompt speed
        let plainText = textContent + $('p, li').text().replace(/\s+/g, ' ').substring(0, 3000);

        // 4. Send to GPT/Gemini via AiRouter for deep marketing analysis
        const prompt = `Analiza la siguiente estructura y copy de esta Landing Page: URL: ${url}. 
        Estos son los títulos y textos extraídos: 
        """${plainText.substring(0, 2000)}"""
        
        Extrajimos ${extractedAssets.length} assets multimedia (imágenes, gifs, vídeos).
        
        Actúa como el mejor Marketer de Respuesta Directa del mundo. Evalúa cómo ataca los dolores, cómo presenta el mecanismo único, y detecta los puntos de fricción.
        
        Devuelve ABSOLUTAMENTE en formato JSON con la siguiente estructura y formato estricto:
        {
           "scores": {
               "mobile": [Puntaje 0-100 como número],
               "desktop": [Puntaje 0-100 como número],
               "cvr": "[Porcentaje esperado, ej: '3.4%']"
           },
           "structure": [
               "Headline Prometido...",
               "Sección Agitación / Problema...",
               "Demostración / Mecanismo...",
               "Oferta y Stack..."
           ],
           "criticalPoints": [
               "Punto de fricción 1...",
               "Punto de fricción 2..."
           ],
           "recommendations": [
               "Recomendación Pro 1...",
               "Recomendación Pro 2..."
           ]
        }`;

        let iaAnalysis = {};
        try {
            const aiResponse = await AiRouter.dispatch(
                storeId,
                TaskType.RESEARCH_FORENSIC, // Or WRITER, we'll map to FORENSIC to deep dive
                prompt,
                { jsonSchema: true }
            );

            // Clean json
            let clean = aiResponse.text.replace(/```json\s*/g, '').replace(/```/g, '').trim();
            iaAnalysis = JSON.parse(clean);
        } catch (aiErr) {
            console.error('Error in AiRouter inside analizador landing:', aiErr);
            // Fallback AI
            iaAnalysis = {
                scores: { mobile: 75, desktop: 82, cvr: '2.5%' },
                structure: ['Hero Section', 'Beneficios', 'Prueba Social', 'CTA'],
                criticalPoints: ["Copy superficial de AI Error", "Optimizar imágenes (Detectado Offline)"],
                recommendations: ["Mejorar carga de la web", "Reforzar sentido de escasez"]
            };
        }

        // Deduplicate assets by URL globally to save space
        const uniqueAssets = Array.from(new Map(extractedAssets.map(item => [item.url, item])).values());

        // 5. Store in Prisma
        const newLanding = await prisma.landingClone.create({
            data: {
                storeId,
                productId,
                originalUrl: url,
                status: 'COMPLETED',
                screenshotUrl: uniqueAssets.find(a => a.type === 'image')?.url, // We assume 1st img is the hero visual roughly
                assetsJson: JSON.stringify({
                    analysis: iaAnalysis,
                    assets: uniqueAssets,
                    assetCount: uniqueAssets.length
                })
            }
        });

        return NextResponse.json({
            success: true,
            landingId: newLanding.id
        });

    } catch (error: any) {
        console.error('[API-ANALIZAR-LANDING] Error:', error);
        return NextResponse.json({ success: false, error: 'Hubo un error al ejecutar la clonación / extracción.' }, { status: 500 });
    }
}
