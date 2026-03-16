import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const productId = req.nextUrl.searchParams.get('productId');
    if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 });

    try {
        const steps = await (prisma.researchStep as any).findMany({
            where: { productId, stepKey: { in: ['P2', 'P21', 'P3'] } },
            orderBy: { createdAt: 'desc' },
        });

        const get = (key: string) => {
            const s = steps.find((s: any) => s.stepKey === key);
            if (!s?.outputJson) return null;
            try { return JSON.parse(s.outputJson); } catch { return null; }
        };

        const p2 = get('P2');
        const p21 = get('P21');
        const p3Raw = get('P3');

        let p3: any = {};
        if (p3Raw?.raw) {
            try {
                const cleaned = p3Raw.raw.replace(/```json\n?/g, '').replace(/```/g, '').trim();
                p3 = JSON.parse(cleaned);
            } catch { p3 = {}; }
        } else if (p3Raw) {
            p3 = p3Raw;
        }

        const langBank: Record<string, any> = {};
        (p21?.language_bank || []).forEach((lb: any) => {
            langBank[lb.avatar_id] = lb.vocabulary_clusters;
        });

        const avatars = (p2?.avatars || []).slice(0, 6).map((av: any) => ({
            id: av.id || av.avatar_id,
            name: av.name,
            age: av.age,
            gender: av.gender || '',
            occupation: av.occupation,
            location: av.location || '',
            biography: (av.biography || '').slice(0, 150),
            language: langBank[av.id] || langBank[av.avatar_id] || null,
            painPreview: langBank[av.id]?.pain_phrases?.[0] || langBank[av.avatar_id]?.pain_phrases?.[0] || '',
            hopePreview: langBank[av.id]?.hope_phrases?.[0] || langBank[av.avatar_id]?.hope_phrases?.[0] || '',
        }));

        const rawAngles =
            p3.angles || p3.angle_tree || p3.marketing_angles?.angle_tree ||
            (p3.blockingBeliefs || []).map((b: any, i: number) => ({
                concept: `Creencia ${i + 1}`,
                angle: b.belief,
                hook: b.whyItBlocks,
            }));

        const angles = (rawAngles || []).slice(0, 8).map((a: any, i: number) => ({
            id: String(i),
            concept: a.concept || a.angle || `Ángulo ${i + 1}`,
            angle: a.angle || a.belief || '',
            hook: a.hook || a.lead_lines || a.hooks?.[0]?.text || a.hooks?.[0] || '',
            awareness: a.awareness_level || '',
        }));

        return NextResponse.json({ avatars, angles, hasLanguageBank: Object.keys(langBank).length > 0 });

    } catch (e: any) {
        console.error('[creative-data]', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
