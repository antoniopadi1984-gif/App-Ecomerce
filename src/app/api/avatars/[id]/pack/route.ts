import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const avatar = await (prisma as any).avatarProfile.findUnique({
        where: { id },
        include: { assets: true }
    });

    if (!avatar) return NextResponse.json({ error: 'Avatar no encontrado' }, { status: 404 });

    const packComplete = avatar.assets.length >= 11;

    return NextResponse.json({
        ok: true,
        avatar: {
            id: avatar.id,
            name: avatar.name,
            status: avatar.status,
            imageUrl: avatar.imageUrl,
            voiceId: avatar.voiceId,
            language: avatar.language
        },
        assets: avatar.assets.map((a: any) => ({
            id: a.id, type: a.type,
            url: a.url || a.driveUrl,
            driveFileId: a.driveFileId,
            mime: a.mimeType
        })),
        packComplete,
        packProgress: `${avatar.assets.length}/11`,
        missing: packComplete ? [] : [
            '3 fotos de alta calidad',
            '2 clips de saludo',
            '5 expresiones faciales',
            '1 frame de referencia'
        ].slice(0, 11 - avatar.assets.length)
    });
}
