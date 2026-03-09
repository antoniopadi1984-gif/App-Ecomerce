import { NextRequest, NextResponse } from 'next/server';
import { ElevenLabsService } from '@/lib/services/elevenlabs-service';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const files = formData.getAll('files') as File[];

        if (!name || files.length === 0) {
            return NextResponse.json({ error: 'Name and at least one audio file required' }, { status: 400 });
        }

        const audioFiles = await Promise.all(
            files.map(async (file) => ({
                buffer: Buffer.from(await file.arrayBuffer()),
                name: file.name,
            }))
        );

        const voiceId = await ElevenLabsService.addVoice(name, description, audioFiles);

        // 11.3 Vincular Voces con AvatarProfile y AiAvatar
        const profileId = formData.get('avatarProfileId') as string;
        const avatarCode = formData.get('avatarCode') as string;

        const defaultSettings = {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.0,
            use_speaker_boost: true
        };

        if (profileId) {
            await (prisma as any).avatarProfile.update({
                where: { id: profileId },
                data: {
                    voiceId: voiceId,
                    voiceProvider: "ELEVENLABS",
                    voiceSettings: JSON.stringify(defaultSettings)
                }
            });
        }

        if (avatarCode) {
            await (prisma as any).aiAvatar.update({
                where: { avatarCode },
                data: {
                    elevenVoiceId: voiceId,
                    voiceStability: defaultSettings.stability,
                    voiceSimilarity: defaultSettings.similarity_boost,
                    voiceStyle: defaultSettings.style
                }
            });
        }

        return NextResponse.json({ success: true, voiceId, profileId, avatarCode });
    } catch (error: any) {
        console.error('[ElevenLabs/Clone] Error:', error.response?.data || error.message);
        return NextResponse.json({ error: 'Failed to clone voice: ' + (error.response?.data?.detail?.message || error.message) }, { status: 500 });
    }
}
