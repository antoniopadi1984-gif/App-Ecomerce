import { NextRequest, NextResponse } from 'next/server';
import { generateSceneClip, assembleVideo } from '@/lib/creative/video-pipeline';
import { prisma } from '@/lib/prisma';

export const maxDuration = 300;
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    const storeId = req.headers.get('X-Store-Id') || 'store-main';
    try {
        const {
            productId,
            script,
            avatarImageUrl,
            voiceId,
            voiceSettings,
            addMusic = false,
            musicStyle,
            transitionType = 'cut',
            outputFormat = '9:16',
            saveToLibrary = true,
            preGeneratedClips,
        } = await req.json();

        if (!script?.scenes || !voiceId) {
            return NextResponse.json({ error: 'script.scenes y voiceId requeridos' }, { status: 400 });
        }

        const product = await (prisma.product as any).findUnique({
            where: { id: productId },
            select: { title: true, imageUrl: true }
        });

        // Si vienen clips pregenerados (montaje final), solo montar
        if (preGeneratedClips && preGeneratedClips.length > 0) {
            const sceneResults = preGeneratedClips.map((c: any) => ({
                sceneId: c.sceneId,
                clipUrl: c.clipUrl,
                audioUrl: '',
                status: 'done' as const,
            }));

            const finalBuffer = await assembleVideo(sceneResults, {
                addMusic: !!musicStyle,
                musicUrl: undefined,
                transitionType,
                outputFormat,
            });

            let finalVideoUrl = `data:video/mp4;base64,${finalBuffer.toString('base64')}`;

            if (saveToLibrary && productId) {
                try {
                    await (prisma.creativeAsset as any).create({
                        data: {
                            productId,
                            storeId,
                            type: 'VIDEO',
                            concept: script.title || 'Video Estudio IA',
                            videoUrl: finalVideoUrl,
                            status: 'READY',
                        }
                    });
                } catch {}
            }

            return NextResponse.json({ success: true, videoUrl: finalVideoUrl, scenes: sceneResults });
        }

        // Generar clips escena por escena
        const scenes = script.scenes;
        const avatarUrl = avatarImageUrl || product?.imageUrl || '';

        const sceneResults = [];
        for (const scene of scenes) {
            const result = await generateSceneClip(
                scene,
                avatarUrl,
                voiceId,
                voiceSettings,
                product?.imageUrl
            );
            sceneResults.push(result);
            await new Promise(r => setTimeout(r, 2000));
        }

        return NextResponse.json({
            success: true,
            scenes: sceneResults,
            totalScenes: scenes.length,
            successfulScenes: sceneResults.filter((s: any) => s.status === 'done').length,
        });

    } catch (e: any) {
        console.error('[generate-video-scenes]', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
