import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadToProduct } from '@/lib/services/drive-service';
import { AiRouter } from '@/lib/ai/router';
import { TaskType } from '@/lib/ai/providers/interfaces';
import { DEFAULT_AGENT_PROMPTS } from '@/lib/ai/defaults/agent-prompts';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
    const storeId = req.headers.get('X-Store-Id') || 'store-main';
    const { cloneData, productoId, competitorId } = await req.json();

    if (!productoId || !cloneData?.html) {
        return NextResponse.json({ error: 'productoId y cloneData.html requeridos' }, { status: 400 });
    }

    const timestamp = Date.now();

    // 1. Subir HTML completo a Drive
    const htmlBuffer = Buffer.from(cloneData.html, 'utf-8');
    const htmlFileName = `LANDING_SPY_${competitorId || 'COMP'}_${timestamp}.html`;
    const htmlDrive = await uploadToProduct(
        htmlBuffer, htmlFileName, 'text/html', productoId, storeId,
        { subfolderName: `00_INBOX/SPY/${competitorId || 'GENERAL'}/LANDINGS`, fileType: 'LANDING' }
    );

    // 2. Subir screenshot si viene en base64
    let screenshotDrive: { driveFileId: string; driveUrl: string } | null = null;
    if (cloneData.screenshot) {
        const screenshotBuffer = Buffer.from(
            cloneData.screenshot.replace(/^data:image\/\w+;base64,/, ''), 'base64'
        );
        const screenshotFileName = `SCREENSHOT_${competitorId || 'COMP'}_${timestamp}.jpg`;
        screenshotDrive = await uploadToProduct(
            screenshotBuffer, screenshotFileName, 'image/jpeg', productoId, storeId,
            { subfolderName: `00_INBOX/SPY/${competitorId || 'GENERAL'}/LANDINGS`, fileType: 'IMAGE' }
        ).catch(() => null);
    }

    // 3. Registrar en LandingClone (campos que existen en schema)
    await prisma.landingClone.create({
        data: {
            storeId,
            productId: productoId,
            originalUrl: cloneData.url || '',
            clonedUrl: htmlDrive.driveUrl,
            status: 'COMPLETED',
            screenshotUrl: screenshotDrive?.driveUrl || null,
            assetsJson: JSON.stringify({
                driveFileId: htmlDrive.driveFileId,
                driveUrl: htmlDrive.driveUrl,
                screenshotDriveId: screenshotDrive?.driveFileId,
                competitorId,
                h1: cloneData.copy?.h1 || ''
            })
        }
    });

    // 4. Registrar en DriveAsset (con más contexto para agentes)
    await (prisma as any).driveAsset.create({
        data: {
            productId: productoId, storeId,
            driveFileId: htmlDrive.driveFileId,
            driveUrl: htmlDrive.driveUrl,
            drivePath: `00_INBOX/SPY/${competitorId || 'GENERAL'}/LANDINGS`,
            assetType: 'LANDING_CLONE',
            sourceUrl: cloneData.url || '',
            organized: true, agentReadable: true,
            metadata: JSON.stringify({
                competitorId, h1: cloneData.copy?.h1 || '',
                screenshotDriveId: screenshotDrive?.driveFileId
            })
        }
    });

    // 5. Análisis forense CREATIVE_FORENSIC en background (no bloquea la respuesta)
    const cleanText = cloneData.html
        .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 6000);

    ;(async () => {
        try {
            const analysis = await AiRouter.dispatch(
                storeId, TaskType.RESEARCH_FORENSIC,
                `${DEFAULT_AGENT_PROMPTS.CREATIVE_FORENSIC}

LANDING CLONADA DE COMPETIDOR:
URL: ${cloneData.url}
CONTENIDO: ${cleanText}

Analiza en 10 niveles y devuelve JSON completo con:
headline, mechanism, offer, guarantee, schwartz_level,
spencerConcept, hooks, weaknesses, strengths,
emotionalTriggers, overallScore, recommendedAngles`,
                { jsonSchema: true }
            );

            let analysisData: any = {};
            try {
                const clean = analysis.text.replace(/```json\s*/g, '').replace(/```/g, '').trim();
                analysisData = JSON.parse(clean);
            } catch { analysisData = { raw: analysis.text }; }

            // Actualizar DriveAsset con análisis forense completo
            await (prisma as any).driveAsset.updateMany({
                where: { driveFileId: htmlDrive.driveFileId },
                data: { analysisJson: JSON.stringify(analysisData) }
            });
        } catch (e: any) {
            console.error('[CloneLanding] Análisis background error:', e.message);
        }
    })();

    return NextResponse.json({
        ok: true,
        driveUrl: htmlDrive.driveUrl,
        driveFileId: htmlDrive.driveFileId,
        screenshotDriveId: screenshotDrive?.driveFileId,
        message: 'Landing clonada en Drive. Análisis forense iniciado en background.'
    });
}
