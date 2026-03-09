import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const {
            name,
            voiceId,
            voiceSettings,
            language,
            speed,
            imageUrl,
            status,
            metadataJson
        } = body;

        const updated = await (prisma as any).avatarProfile.update({
            where: { id },
            data: {
                name,
                voiceId,
                voiceSettings: voiceSettings ? JSON.stringify(voiceSettings) : undefined,
                language,
                speed,
                imageUrl,
                status,
                metadataJson
            }
        });

        return NextResponse.json({ success: true, avatar: updated });
    } catch (e: any) {
        console.error('[Avatars/PATCH] Error:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const avatar = await (prisma as any).avatarProfile.findUnique({
            where: { id }
        });

        if (!avatar) {
            return NextResponse.json({ error: 'Avatar not found' }, { status: 404 });
        }

        return NextResponse.json({ avatar });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await (prisma as any).avatarProfile.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
