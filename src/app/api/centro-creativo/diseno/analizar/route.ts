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
        $('h1, h2, h3, h4, h5, h6, strong, p, b, i, li, span').each((i, el) => {
             const t = $(el).text().trim();
             if (t && t.length > 3) textContent += t + ' | ';
        });
        
        // Strip everything and just take a limited chunk of text (around 5000 chars) 
        let plainText = textContent.replace(/\s+/g, ' ').substring(0, 5000);

        console.log(`[ANALIZADOR] URL: ${url} | Content Length: ${plainText.length} | Assets: ${extractedAssets.length}`);

        // 4. Send to GPT/Gemini via AiRouter for deep marketing analysis
        const prompt = `Analiza la estructura de esta Landing Page: URL: ${url}. 
        Texto extraído: 
        """${plainText}"""
        
        Assets: ${extractedAssets.length} detectados.
        
        Actúa como Marketer Experto. Detecta mecanismo único, hook y sección de productos.
        
        Devuelve JSON ESTRICTO:
        {
           "scores": { "hook": 0-100, "mechanism": 0-100, "offer": 0-100 },
           "productCount": número,
           "productsFound": ["nombre"],
           "structure": ["paso 1", "paso 2"],
           "criticalPoints": ["punto 1"],
           "recommendations": ["mejora 1"]
        }`;

        let iaAnalysis: any = {
            scores: { hook: 0, mechanism: 0, offer: 0 },
            productCount: 0,
            productsFound: [],
            structure: [],
            criticalPoints: [],
            recommendations: []
        };

        try {
            console.log(`[ANALIZADOR] Calling AiRouter...`);
            const aiResponse = await AiRouter.dispatch(
                storeId,
                TaskType.RESEARCH_FORENSIC,
                prompt,
                { jsonSchema: true }
            );

            console.log(`[ANALIZADOR] AI Response received. Length: ${aiResponse.text.length}`);

            let clean = aiResponse.text.replace(/```json\s*/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(clean);
            iaAnalysis = { ...iaAnalysis, ...parsed };
        } catch (aiErr: any) {
            console.error('[ANALIZADOR] AI Error:', aiErr?.message || aiErr);
            iaAnalysis.criticalPoints = ["No se pudo conectar con la IA para un análisis profundo."];
            iaAnalysis.structure = ["Estructura detectada visualmente, pero análisis marketing falló."];
        }

        // Deduplicate assets by URL globally to save space
        const uniqueAssets = Array.from(new Map(extractedAssets.map(item => [item.url, item])).values()).slice(0, 30);

        // 5. Store in Prisma
        const newLanding = await prisma.landingClone.create({
            data: {
                storeId,
                productId,
                originalUrl: url,
                status: 'COMPLETED',
                screenshotUrl: uniqueAssets.find(a => a.type === 'image' && !a.url.includes('logo'))?.url || uniqueAssets[0]?.url, 
                assetsJson: JSON.stringify({
                    analysis: iaAnalysis,
                    assets: uniqueAssets,
                    assetCount: uniqueAssets.length
                })
            }
        });

        console.log(`[ANALIZADOR] Saved landing ID: ${newLanding.id}`);

        return NextResponse.json({
            success: true,
            landingId: newLanding.id
        });

    } catch (error: any) {
        console.error('[API-ANALIZAR-LANDING] Error:', error);
        return NextResponse.json({ success: false, error: 'Hubo un error al ejecutar la clonación / extracción.' }, { status: 500 });
    }
}
