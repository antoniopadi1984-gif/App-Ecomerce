import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { avatarId: string } }) {
    try {
        const current = await (prisma as any).heygenAvatar.findUnique({ where: { avatarId: params.avatarId } });
        if (!current) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
        const updated = await (prisma as any).heygenAvatar.update({
            where: { avatarId: params.avatarId },
            data: { isFavorite: !current.isFavorite }
        });
        return NextResponse.json({ isFavorite: updated.isFavorite });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
