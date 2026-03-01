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

// POST /api/avatars
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, gender, language, voiceId, imageUrl, storeId, productId } = body;
        if (!storeId || !name) return NextResponse.json({ success: false, error: 'storeId and name required' }, { status: 400 });

        const avatar = await (prisma as any).avatarProfile.create({
            data: {
                storeId,
                name,
                gender: gender ?? 'F',
                language: language ?? 'es',
                voiceId: voiceId ?? null,
                imageUrl: imageUrl ?? null,
            }
        });

        return NextResponse.json({ success: true, avatar });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
