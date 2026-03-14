import { NextRequest, NextResponse } from 'next/server';
import { generateImage, generateVideo } from '@/lib/replicate-client';
import { prisma } from '@/lib/prisma';
import { uploadToProduct } from '@/lib/services/drive-service';
import { BrandingEngine } from '@/lib/services/branding-engine';

export const maxDuration = 300; // 5 minutes for full batch
export const runtime = 'nodejs';

/**
 * POST /api/creative/generate-full-batch
 * Genera un set completo de creativos para un producto:
 * - Packaging (Imagen 3)
 * - Static Ads (Ideogram)
 * - Quick Variations (Flux Schnell)
 * - Videos (Veo 3 & Kling V3)
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { productId, storeId, packagingPrompt, adPrompt, format = '1:1', mode = 'all' } = body;

        if (!productId || !storeId) {
            return NextResponse.json({ error: 'productId and storeId required' }, { status: 400 });
        }

        const branding = await BrandingEngine.getProfile(productId);
        const results: any = {
            generated: [],
            errors: []
        };

        // 1. Packaging — usar Imagen 3 (Nano Banana) — mejor calidad de producto
        if (packagingPrompt && (mode === 'images' || mode === 'all')) {
            try {
                console.log('[Batch] Generating packaging...');
                const url = await generateImage({
                    prompt: packagingPrompt,
                    mode: 'imagen3',
                    aspectRatio: '1:1'
                });
                
                const res = await fetch(url);
                const buffer = Buffer.from(await res.arrayBuffer());
                const upload = await uploadToProduct(buffer, `packaging_${Date.now()}.png`, 'image/png', productId, storeId, {
                    conceptCode: 'PACK', funnelStage: 'TOF', fileType: 'IMAGE'
                });
                results.generated.push({ type: 'PACKAGING', url, driveFileId: upload.driveFileId });
            } catch (e: any) {
                results.errors.push({ type: 'PACKAGING', error: e.message });
            }
        }

        // 2. Static ads con texto en imagen — usar Ideogram con JSON nativo
        if (adPrompt && (mode === 'images' || mode === 'all')) {
            try {
                console.log('[Batch] Generating static ad (Ideogram)...');
                const adUrl = await generateImage({
                    prompt: adPrompt,
                    mode: 'ideogram',
                    aspectRatio: format as any,
                    jsonPrompt: {
                        image_request: {
                            prompt: adPrompt,
                            aspect_ratio: format === '1:1' ? 'ASPECT_1_1' : format === '9:16' ? 'ASPECT_9_16' : 'ASPECT_4_5',
                            model: 'V_3',
                            rendering_speed: 'BALANCED',
                            style_type: 'REALISTIC',
                        }
                    }
                });

                const res = await fetch(adUrl);
                const buffer = Buffer.from(await res.arrayBuffer());
                const upload = await uploadToProduct(buffer, `static_ad_ideogram_${Date.now()}.png`, 'image/png', productId, storeId, {
                    conceptCode: 'AD', funnelStage: 'TOF', fileType: 'IMAGE'
                });
                results.generated.push({ type: 'STATIC_AD', url: adUrl, driveFileId: upload.driveFileId });
            } catch (e: any) {
                results.errors.push({ type: 'STATIC_AD', error: e.message });
            }
        }

        // ── 6 VIDEO PROMPTS (Veo 3 + Kling según ángulo) ──
        if (branding && (mode === 'videos' || mode === 'all')) {
            console.log('[Batch] Generating videos...');
            const videoPrompts = JSON.parse(branding.videoPrompts || '[]');
            
            for (let i = 0; i < Math.min(videoPrompts.length, 6); i++) {
                const vp = videoPrompts[i];
                
                // Ángulos 1-3 → Veo 3 (más cinematográfico, mejor para producto)
                // Ángulos 4-6 → Kling v3 (más dinámico, mejor para UGC)
                const isVeo = i < 3;
                
                try {
                    const videoUrl = await generateVideo({
                        prompt: vp.script || vp.prompt || adPrompt, // fallback chain
                        mode: isVeo ? 'veo3' : 'standard',
                        quality: isVeo ? 'premium' : 'balanced',
                        aspectRatio: '9:16',
                        duration: 8,
                    });

                    const videoBuf = Buffer.from(await (await fetch(videoUrl)).arrayBuffer());
                    const stage = i < 2 ? 'TOF' : i < 4 ? 'MOF' : 'RETARGETING';
                    const upload = await uploadToProduct(
                        videoBuf,
                        `video_A${i+1}_${vp.type || 'GEN'}_${Date.now()}.mp4`,
                        'video/mp4',
                        productId, storeId,
                        { subfolderName: `05_VIDEOS/${stage}`, conceptCode: `A${i+1}`, funnelStage: stage }
                    );
                    results.generated.push({ type: 'VIDEO', angle: i+1, model: isVeo ? 'veo3' : 'kling-v3', driveFileId: upload.driveFileId, url: videoUrl });
                } catch (e: any) {
                    console.error(`[Batch] Error in video angle ${i+1}:`, e);
                    results.errors.push({ type: 'VIDEO', angle: i+1, error: e.message });
                }
            }
        }

        // 3. Variación barata/test — usar Flux Schnell (Opcional, si adPrompt existe)
        if (adPrompt && (mode === 'images' || mode === 'all')) {
            try {
                console.log('[Batch] Generating quick variation (Flux Schnell)...');
                const quickUrl = await generateImage({
                    prompt: adPrompt,
                    mode: 'generate',
                    model: 'black-forest-labs/flux-schnell',
                    aspectRatio: format as any
                });

                const res = await fetch(quickUrl);
                const buffer = Buffer.from(await res.arrayBuffer());
                const upload = await uploadToProduct(buffer, `quick_variant_${Date.now()}.png`, 'image/png', productId, storeId, {
                    conceptCode: 'QUICK', funnelStage: 'TOF', fileType: 'IMAGE'
                });
                results.generated.push({ type: 'QUICK_VARIANT', url: quickUrl, driveFileId: upload.driveFileId });
            } catch (e: any) {
                results.errors.push({ type: 'QUICK_VARIANT', error: e.message });
            }
        }

        return NextResponse.json({
            ok: true,
            results,
            message: 'Full batch generated successfully'
        });

    } catch (err: any) {
        console.error('[BatchAPI] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
