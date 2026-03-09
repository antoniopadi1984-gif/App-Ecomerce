import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/avatars?storeId=X
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') ?? request.headers.get('X-Store-Id');
    const avatars = await (prisma as any).avatarProfile.findMany({
        where: storeId ? { storeId } : {},
        orderBy: { createdAt: 'desc' },
        take: 50,
    });
    return NextResponse.json({ avatars });
}

import { AvatarPackService } from '@/lib/services/avatar-pack-service';

// POST /api/avatars
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            name,
            gender,
            language,
            voiceId,
            imageUrl,
            storeId,
            productId,
            type, // IA_SCRATCH, REAL_PHOTOS, IMPORT
            description,
            psychographic
        } = body;

        if (!storeId || !name) {
            return NextResponse.json({ success: false, error: 'storeId and name required' }, { status: 400 });
        }

        // Generate Avatar ID: [PROD]-AV01
        let avatarId = 'AV-TEMP';
        if (productId) {
            const product = await (prisma as any).product.findUnique({
                where: { id: productId },
                select: { title: true }
            });
            const sku = (product?.title?.split(' ')[0] || 'PROD').toUpperCase();
            const count = await (prisma as any).avatarProfile.count({ where: { productId } });
            avatarId = `${sku}-AV${String(count + 1).padStart(2, '0')}`;
        }

        const avatar = await (prisma as any).avatarProfile.create({
            data: {
                storeId,
                productId,
                avatarId,
                name,
                gender: gender ?? 'F',
                language: language ?? 'es',
                voiceId: voiceId ?? null,
                imageUrl: imageUrl ?? null,
                status: 'GENERATING',
                promptDNA: `${description || ''}\n\nPsychographic Profile:\n${psychographic || ''}`.trim()
            }
        });

        // Trigger Avatar Pack generation in the background
        if (productId) {
            AvatarPackService.generatePack(avatar.id, productId, storeId)
                .then(() => console.log(`[AvatarAPI] Pack generated for ${avatar.id}`))
                .catch(err => console.error(`[AvatarAPI] Pack generation failed for ${avatar.id}:`, err));
        }

        return NextResponse.json({ success: true, avatar });
    } catch (e: any) {
        console.error('[Avatars/POST] Error:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}


