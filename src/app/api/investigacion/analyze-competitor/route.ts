import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { url, country, price, storeId, productId } = body;

        if (!url || !storeId) {
            return NextResponse.json({ error: 'url and storeId required' }, { status: 400 });
        }

        // Fetch and parse the competitor landing page
        let pageContent = '';
        try {
            const res = await fetch(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EcomBot/1.0)' },
                signal: AbortSignal.timeout(10000),
            });
            const html = await res.text();
            // Strip HTML tags for basic text extraction
            pageContent = html
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 4000); // First 4000 chars
        } catch (e) {
            console.warn('[AnalyzeCompetitor] Could not fetch page:', e);
            pageContent = 'Page not accessible';
        }

        // Use Gemini to extract structured data
        let analysis: any = {};
        try {
            const { GoogleGenerativeAI } = await import('@google/generative-ai');
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.VERTEX_AI_API_KEY || '');
            const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL_FAST || 'gemini-3-flash-preview' });

            const prompt = `Analiza esta landing page de un competidor de ecommerce y extrae:
1. headline: titular principal de la página
2. offer: la oferta principal (descuento, bundle, garantía)
3. guarantee: garantía ofrecida
4. socialProof: prueba social (reviews, testimonios, números)
5. cta: call to action principal
6. pageStructure: estructura de la página (Hero, Benefits, Testimonials, etc.) en JSON array
7. brandingNotes: notas sobre branding, tono, colores (descripción textual)

URL: ${url}
Contenido de la página:
${pageContent}

Responde SOLO con JSON válido sin markdown ni código, ejemplo:
{"headline":"...","offer":"...","guarantee":"...","socialProof":"...","cta":"...","pageStructure":"[...]","brandingNotes":"..."}`;

            const result = await model.generateContent(prompt);
            const text = result.response.text().trim();
            analysis = JSON.parse(text.replace(/```json\n?|\n?```/g, ''));
        } catch (e) {
            console.warn('[AnalyzeCompetitor] AI analysis failed:', e);
            analysis = { headline: 'N/A', offer: 'N/A', guarantee: 'N/A', socialProof: 'N/A', cta: 'N/A' };
        }

        // Save to DB
        const saved = await (prisma as any).competitorAnalysis.create({
            data: {
                productId: productId || null,
                storeId,
                url,
                country: country || null,
                price: price ? Number(price) : null,
                headline: analysis.headline || null,
                offer: analysis.offer || null,
                guarantee: analysis.guarantee || null,
                socialProof: analysis.socialProof || null,
                cta: analysis.cta || null,
                pageStructure: analysis.pageStructure || null,
                brandingNotes: analysis.brandingNotes || null,
            }
        });

        return NextResponse.json({ success: true, analysis: saved });

    } catch (error) {
        console.error('[AnalyzeCompetitor] Error:', error);
        return NextResponse.json({ success: false, error: 'Analysis failed' }, { status: 500 });
    }
}
