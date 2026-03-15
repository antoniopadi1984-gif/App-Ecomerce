import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadToProduct } from '@/lib/services/drive-service';
import { AiRouter } from '@/lib/ai/router';
import { TaskType } from '@/lib/ai/providers/interfaces';
import { MetadataRemover } from '@/lib/creative/generators/metadata-remover';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
    const storeId = req.headers.get('X-Store-Id') || 'store-main';
    const { targetUrl, competitorId, productId } = await req.json();

    if (!targetUrl || !productId) {
        return NextResponse.json({ error: 'URL y productId requeridos' }, { status: 400 });
    }

    // 1. Fetch de la landing — sin bot UA
    const html = await fetch(targetUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(10000)
    }).then(r => r.text()).catch(() => '');

    // 2. Extraer URLs de imágenes del HTML
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
    const bgRegex = /url\(["']?([^"')]+)["']?\)/gi;
    const imageUrls: string[] = [];
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
        const url = match[1];
        if (url.startsWith('http') && (url.includes('.jpg') || url.includes('.png') || url.includes('.webp'))) {
            imageUrls.push(url);
        }
    }
    while ((match = bgRegex.exec(html)) !== null) {
        const url = match[1];
        if (url.startsWith('http') && imageUrls.length < 50) imageUrls.push(url);
    }

    // 3. Extraer textos clave con regex
    const getTag = (tag: string) => {
        const m = html.match(new RegExp(`<${tag}[^>]*>([^<]+)<\/${tag}>`, 'i'));
        return m ? m[1].trim() : '';
    };
    const h1 = getTag('h1');
    const h2s = [...html.matchAll(/<h2[^>]*>([^<]+)<\/h2>/gi)].map(m => m[1].trim()).slice(0, 5);
    const cleanText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

    // 4. Clasificar imágenes con Gemini Vision
    const classification = await AiRouter.dispatch(
        storeId, TaskType.RESEARCH_FORENSIC,
        `Analiza estas URLs de imágenes de una landing de competidor y clasifícalas.
URLs: ${JSON.stringify(imageUrls.slice(0, 20))}
H1: "${h1}"
Texto: "${cleanText.slice(0, 2000)}"

Devuelve JSON:
{
  "clasificados": { "producto": [], "lifestyle": [], "ugc": [], "beforeAfter": [], "badges": [], "iconos": [] },
  "textos": { "h1": "", "h2": [], "claims": [], "ctas": [] },
  "emotionalTriggers": [],
  "schwartz_level": 1-5,
  "spencerConcept": "C1-C9"
}`,
        { jsonSchema: true }
    );

    let analysisData: any = {};
    try {
        const clean = classification.text.replace(/```json\s*/g, '').replace(/```/g, '').trim();
        analysisData = JSON.parse(clean);
    } catch { analysisData = { textos: { h1, h2: h2s, claims: [], ctas: [] } }; }

    // 5. Descargar y subir imágenes a Drive (máx 10)
    const uploadedImages: any[] = [];
    const topImages = imageUrls.slice(0, 10);
    for (const imgUrl of topImages) {
        try {
            const imgBuffer = await fetch(imgUrl, { signal: AbortSignal.timeout(5000) })
                .then(r => r.arrayBuffer()).then(ab => Buffer.from(ab));
            const fileName = `SPY_${competitorId || 'COMP'}_${Date.now()}.jpg`;
            const stripped = await MetadataRemover.stripImage(imgBuffer, fileName).catch(() => imgBuffer);
            const driveResult = await uploadToProduct(
                stripped, fileName, 'image/jpeg', productId, storeId,
                { subfolderName: `00_INBOX/SPY/${competitorId || 'GENERAL'}/ASSETS`, fileType: 'IMAGE' }
            );
            uploadedImages.push({ url: imgUrl, driveUrl: driveResult.driveUrl, driveFileId: driveResult.driveFileId });
        } catch { /* imagen no descargable, skip */ }
    }

    // 6. Registrar en BD
    await (prisma as any).driveAsset.create({
        data: {
            productId, storeId,
            driveFileId: `spy_extract_${Date.now()}`,
            drivePath: `00_INBOX/SPY/${competitorId || 'GENERAL'}/ASSETS`,
            assetType: 'SPY_EXTRACT',
            sourceUrl: targetUrl,
            organized: true,
            agentReadable: true,
            analysisJson: JSON.stringify(analysisData),
            metadata: JSON.stringify({ totalImages: imageUrls.length, uploaded: uploadedImages.length, competitorId })
        }
    });

    return NextResponse.json({
        ok: true,
        data: {
            url: targetUrl,
            imagesExtracted: imageUrls.length,
            imagesUploaded: uploadedImages.length,
            uploadedImages,
            ...analysisData
        }
    });
}
