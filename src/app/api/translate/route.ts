import { NextRequest, NextResponse } from 'next/server';
import { translateToEs } from '@/lib/translation';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/translate
 *
 * Body:
 *   { text, from, context?, cacheTarget?, cacheId? }
 *
 * cacheTarget: 'researchStep' | 'creativeAsset' | 'comboMatrix'
 * cacheId: the DB row id to save the translation to
 *
 * Returns: { translatedText }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { text, from = 'EN', context, cacheTarget, cacheId } = body;

        if (!text?.trim()) {
            return NextResponse.json({ translatedText: '' });
        }

        // Check DB cache first if cacheTarget + cacheId provided
        if (cacheTarget && cacheId) {
            let cached: string | null = null;

            if (cacheTarget === 'researchStep') {
                const row = await (prisma as any).researchStep.findUnique({
                    where: { id: cacheId }, select: { translationEs: true }
                });
                cached = row?.translationEs ?? null;
            } else if (cacheTarget === 'creativeAsset') {
                const row = await (prisma as any).creativeAsset.findUnique({
                    where: { id: cacheId }, select: { scriptEs: true }
                });
                cached = row?.scriptEs ?? null;
            } else if (cacheTarget === 'comboMatrix') {
                const row = await (prisma as any).comboMatrix.findUnique({
                    where: { id: cacheId }, select: { hookBankEs: true }
                });
                cached = row?.hookBankEs ?? null;
            }

            if (cached) {
                return NextResponse.json({ translatedText: cached, fromCache: true });
            }
        }

        // Generate translation
        const translatedText = await translateToEs(text, from, context);

        // Persist to DB cache
        if (cacheTarget && cacheId && translatedText) {
            try {
                if (cacheTarget === 'researchStep') {
                    await (prisma as any).researchStep.update({
                        where: { id: cacheId },
                        data: { translationEs: translatedText }
                    });
                } else if (cacheTarget === 'creativeAsset') {
                    await (prisma as any).creativeAsset.update({
                        where: { id: cacheId },
                        data: { scriptEs: translatedText }
                    });
                } else if (cacheTarget === 'comboMatrix') {
                    await (prisma as any).comboMatrix.update({
                        where: { id: cacheId },
                        data: { hookBankEs: translatedText }
                    });
                }
            } catch (e) {
                console.warn('[Translate] Cache write failed:', e);
            }
        }

        return NextResponse.json({ translatedText, fromCache: false });

    } catch (error) {
        console.error('[Translate API] Error:', error);
        return NextResponse.json(
            { error: 'Translation failed' },
            { status: 500 }
        );
    }
}
