import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const gender = searchParams.get('gender');
        const search = searchParams.get('search');
        const favOnly = searchParams.get('fav') === 'true';

        const where: any = { isActive: true };
        if (gender && gender !== 'all') where.gender = gender;
        if (favOnly) where.isFavorite = true;
        if (search) where.name = { contains: search };

        const avatars = await (prisma as any).heygenAvatar.findMany({
            where,
            orderBy: [{ isFavorite: 'desc' }, { name: 'asc' }],
        });

        return NextResponse.json({ avatars, total: avatars.length });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
