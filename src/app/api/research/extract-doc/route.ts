import { NextRequest, NextResponse } from 'next/server';
import { AiRouter } from '@/lib/ai/router';
import { TaskType } from '@/lib/ai/providers/interfaces';

export async function POST(req: NextRequest) {
    try {
        const { url, storeId } = await req.json();

        if (!url || !storeId) {
            return NextResponse.json({ error: 'Faltan parámetros URL o storeId' }, { status: 400 });
        }

        // Extraer contenido real — Google Doc o URL normal
        let content = '';

        if (url.includes('docs.google.com')) {
            // Extraer ID del doc desde la URL
            const docId = url.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
            if (!docId) {
                return NextResponse.json({ error: 'No se pudo extraer el ID del Google Doc' }, { status: 400 });
            }
            const { google } = await import('googleapis');
            const { getGoogleAuth } = await import('@/lib/google-auth');
            const auth = await getGoogleAuth(storeId);
            const docs = google.docs({ version: 'v1', auth: auth as any });
            const doc = await docs.documents.get({ documentId: docId });
            content = doc.data.body?.content
                ?.map((b: any) => b.paragraph?.elements?.map((e: any) => e.textRun?.content).join(''))
                .filter(Boolean)
                .join('\n') || '';
        } else {
            // URL normal — fetch + limpiar HTML
            const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const html = await res.text();
            content = html
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .slice(0, 10000);
        }

        if (!content.trim()) {
            return NextResponse.json({ error: 'No se pudo extraer contenido del documento' }, { status: 400 });
        }

        const prompt = `
Analiza este documento de investigación de producto y extrae en JSON:

    // IDENTIDAD
    nombre, categoria, pais, idioma, moneda, urlProducto, urlAmazon

    // FINANCIERO
    precioVenta, costeProducto, costeEnvio, costeManipulacion,
    costeDevolucion, fulfillment,
    tasaEntregaEsperada, tasaConversionEsperada

    // COMPETIDORES detectados en el doc
    competidores: [{ nombre, urlWeb, urlAmazon, precioVenta }]

    // RESEARCH CORE (canónico)
    queHace, queResuelve, queNOResuelve,
    mecanismoBase, mecanismosAlternativos,
    objecionesUniversales, claimsPermitidos,
    nivelSofisticacion, sustitutos, diferenciacionReal

    // P1 — Mass Desire (si está en el doc)
    surfaceDesires: [{ deseo, drivers: [{ driver, frecuencia }] }]

    // P2 — Avatares (si están en el doc)
    avatares: [{ nombre, dolorDominante, emocion, nivelConciencia,
                 triggers, creencias, comportamientos, productosActuales }]

    // P2.1 — Language Bank (si está en el doc)
    languageBank: [{ avatarId, frasesLiterales, quejas,
                     objeciones, transformaciones, tabooWords }]

    // P4 — Ángulos (si están en el doc)
    angulos: [{ nombre, promesa, emocion, enemigo, prueba,
                tipoCreativo, tipoLanding, hooks, ctas }]

    // MECANISMOS detectados
    mecanismos: [{ nombre, descripcion, prueba }]

    // VECTORES detectados
    vectores: [{ dolor, mecanismo, prueba, resultado, cta }]

    Devuelve SOLO JSON válido. Si un campo no aparece en el documento, devuelve null.
    No inventes nada que no esté explícitamente en el documento.
    
    ---- CONTENIDO DEL DOCUMENTO ----
    ${content}
    `;

        const extractedTextRes = await AiRouter.dispatch(
            storeId,
            TaskType.RESEARCH_DEEP, // Using gemini for deep research
            prompt,
            { context: "Eres un extractor de datos en formato JSON puro." }
        );
        const extractedText = extractedTextRes.text;

        // Sanitize the JSON output block from Markdown optionally
        const jsonBlockMatch = extractedText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        let finalJsonText = extractedText;

        if (jsonBlockMatch) {
            finalJsonText = jsonBlockMatch[1];
        } else {
            // Let's strip standard prefixes just in case
            finalJsonText = extractedText.trim();
        }

        const data = JSON.parse(finalJsonText);

        return NextResponse.json({ success: true, data });
    } catch (e: unknown) {
        console.error('[extract-doc] Error', e);
        return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
    }
}
