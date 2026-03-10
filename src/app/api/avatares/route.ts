import { NextRequest, NextResponse } from 'next/server';
import { generateAvatarVideo } from '@/lib/replicate-client';
import { prisma } from '@/lib/prisma';

// GET — listar avatares
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId');
    const avatars = await (prisma as any).avatar?.findMany({
        where: storeId ? { storeId } : {},
        orderBy: { createdAt: 'desc' },
    }).catch(() => []);
    return NextResponse.json({ avatars });
}

// POST — generar vídeo de avatar con lipsync
export async function POST(req: NextRequest) {
    try {
        const { avatarImageUrl, audioUrl, script, storeId, productId } = await req.json();

        if (!avatarImageUrl || !audioUrl) {
            return NextResponse.json({ error: 'avatarImageUrl y audioUrl requeridos' }, { status: 400 });
        }

        const videoUrl = await generateAvatarVideo({ avatarImageUrl, audioUrl, script });

        // Guardar en BD
        const record = await (prisma as any).avatar?.create({
            data: { storeId, productId, videoUrl, audioUrl, avatarImageUrl, script, status: 'COMPLETED' }
        }).catch(() => null);

        return NextResponse.json({ success: true, videoUrl, id: record?.id });
    } catch (error: any) {
        console.error('[avatares]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
